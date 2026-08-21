-- ============================================================================
--  ESCALA PASTORAL DA MÚSICA — Capela São Carlos Borromeu (CSCB)
--  Esquema do banco (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
--  Ordem de execução no painel do Supabase → SQL Editor:
--    1) schema.sql      (este arquivo: tabelas, tipos e índices)
--    2) policies.sql    (Row Level Security — a proteção de verdade)
--    3) seed_agosto_2026.sql   (opcional: carrega a escala da foto)
--    4) cron.sql        (agenda os disparos de aviso)
--
--  Fuso do sistema: America/Sao_Paulo (UTC-3, sem horário de verão).
--  As missas acontecem às 12:00 e 19:00.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ---------------------------------------------------------------------------
--  ENUMS
-- ---------------------------------------------------------------------------
-- Status de um item da escala. Espelha a legenda de cores da escala em PDF:
--   confirmada    -> normal (sem cor especial)
--   sem_grupo     -> VERMELHO  "Escala sem Grupo"
--   inversao      -> VERDE     "Substituição por Inversão de Escala"
--   substituicao  -> AZUL      "Substituição"
--   solenidade    -> LARANJA   "Escala Específica devido a Solenidades"
do $$ begin
  create type status_item as enum
    ('confirmada', 'sem_grupo', 'inversao', 'substituicao', 'solenidade');
exception when duplicate_object then null; end $$;

do $$ begin
  create type papel_usuario as enum ('admin', 'coordenador', 'musico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_aviso as enum ('semana', 'dia_manha', 'dia_tarde');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
--  PESSOAS  (músicos — quem toca e quem recebe os avisos)
-- ---------------------------------------------------------------------------
create table if not exists public.pessoas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete set null, -- vínculo com o login (pode ser nulo se ainda não tem conta)
  nome        text not null,
  sobrenome   text,
  email       text,
  telefone    text,
  papel       papel_usuario not null default 'musico',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);
create index if not exists pessoas_user_id_idx on public.pessoas (user_id);
create unique index if not exists pessoas_email_uidx
  on public.pessoas (lower(email)) where email is not null;

-- ---------------------------------------------------------------------------
--  GRUPOS  (a "unidade" que é escalada: pode ser 1 pessoa, uma dupla ou uma banda)
--  Ex.: "Isaac", "PH e Aline", "Cânticos de Maria", "Banda Consagração"
-- ---------------------------------------------------------------------------
create table if not exists public.grupos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cor         text,            -- cor opcional de identidade visual (hex)
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);
create unique index if not exists grupos_nome_uidx on public.grupos (lower(nome));

-- Integrantes de cada grupo (N:N). É por aqui que o aviso "alcança" a pessoa.
create table if not exists public.grupo_membros (
  grupo_id    uuid not null references public.grupos(id) on delete cascade,
  pessoa_id   uuid not null references public.pessoas(id) on delete cascade,
  primary key (grupo_id, pessoa_id)
);

-- ---------------------------------------------------------------------------
--  ESCALAS  (uma por mês; versionada — "escala atualizada do mês")
-- ---------------------------------------------------------------------------
create table if not exists public.escalas (
  id           uuid primary key default gen_random_uuid(),
  ano          int  not null,
  mes          int  not null check (mes between 1 and 12),
  versao       int  not null default 0,   -- 0 = rascunho; a 1ª publicação vira v1
  publicada    boolean not null default false,
  publicada_em timestamptz,
  observacoes  text,
  criado_em    timestamptz not null default now(),
  unique (ano, mes)
);

-- ---------------------------------------------------------------------------
--  ESCALA_ITENS  (cada célula da grade: um dia + um horário + quem toca)
-- ---------------------------------------------------------------------------
create table if not exists public.escala_itens (
  id          uuid primary key default gen_random_uuid(),
  escala_id   uuid not null references public.escalas(id) on delete cascade,
  data        date not null,
  horario     text not null check (horario in ('12:00', '19:00')),
  grupo_id    uuid references public.grupos(id) on delete set null,
  rotulo      text,                       -- fallback livre quando não há grupo cadastrado
  status      status_item not null default 'confirmada',
  observacao  text,
  criado_em   timestamptz not null default now(),
  unique (escala_id, data, horario)
);
create index if not exists escala_itens_data_idx on public.escala_itens (data);
create index if not exists escala_itens_grupo_idx on public.escala_itens (grupo_id);

-- ---------------------------------------------------------------------------
--  HISTÓRICO DE ALTERAÇÕES  (para a aba "Alterações": auditoria + comunicação)
-- ---------------------------------------------------------------------------
create table if not exists public.escala_alteracoes (
  id          uuid primary key default gen_random_uuid(),
  escala_id   uuid not null references public.escalas(id) on delete cascade,
  item_id     uuid references public.escala_itens(id) on delete set null,
  descricao   text not null,             -- "05/08 19h: Mota Filho → substituído por ..."
  autor       text,
  criado_em   timestamptz not null default now()
);
create index if not exists escala_alteracoes_escala_idx on public.escala_alteracoes (escala_id, criado_em desc);

-- ---------------------------------------------------------------------------
--  COMUNICADOS  (mural de avisos gerais da coordenação)
-- ---------------------------------------------------------------------------
create table if not exists public.comunicados (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  corpo       text not null,
  fixado      boolean not null default false,
  publicado   boolean not null default true,
  autor       text,
  criado_em   timestamptz not null default now()
);
create index if not exists comunicados_criado_idx on public.comunicados (criado_em desc);

-- ---------------------------------------------------------------------------
--  PUSH SUBSCRIPTIONS  (Web Push / PWA — um dispositivo por linha)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  pessoa_id   uuid references public.pessoas(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  criado_em   timestamptz not null default now()
);
create index if not exists push_subs_pessoa_idx on public.push_subscriptions (pessoa_id);

-- ---------------------------------------------------------------------------
--  LOG DE AVISOS  (idempotência: evita disparo duplicado pelo cron)
--  chave = tipo + referência (item da escala ou "ano-semana")
-- ---------------------------------------------------------------------------
create table if not exists public.avisos_enviados (
  id          uuid primary key default gen_random_uuid(),
  tipo        tipo_aviso not null,
  referencia  text not null,             -- ex.: item_id (dia) ou "2026-W31" (semana)
  enviado_em  timestamptz not null default now(),
  destinatarios int not null default 0,
  unique (tipo, referencia)
);

-- ---------------------------------------------------------------------------
--  VIEW auxiliar: quem toca em cada dia/horário, com contatos (para o cron)
-- ---------------------------------------------------------------------------
create or replace view public.v_escalados as
  select
    i.id            as item_id,
    i.data,
    i.horario,
    i.status,
    coalesce(g.nome, i.rotulo) as grupo_nome,
    p.id            as pessoa_id,
    p.nome          as pessoa_nome,
    p.email,
    p.telefone
  from public.escala_itens i
  join public.escalas e   on e.id = i.escala_id and e.publicada = true
  left join public.grupos g       on g.id = i.grupo_id
  left join public.grupo_membros gm on gm.grupo_id = g.id
  left join public.pessoas p      on p.id = gm.pessoa_id and p.ativo = true;

-- IMPORTANTE (segurança): por padrão uma view roda com as permissões do dono e
-- IGNORA o RLS das tabelas base — o que vazaria email/telefone a qualquer um.
-- `security_invoker` faz a view respeitar o RLS de quem consulta, e revogamos o
-- acesso de anon/authenticated: só a Edge Function (service_role, que ignora RLS)
-- precisa ler esta view para montar os avisos.
alter view public.v_escalados set (security_invoker = on);
revoke all on public.v_escalados from anon, authenticated;
