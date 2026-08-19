-- ============================================================================
--  RLS — Row Level Security (a proteção real; rode DEPOIS de schema.sql)
-- ----------------------------------------------------------------------------
--  Regra geral:
--   • Ler escala publicada / comunicados / grupos: qualquer usuário logado.
--   • Escrever (montar escala, publicar, comunicar): só admin ou coordenador.
--   • Cada pessoa gerencia as próprias inscrições de push e o próprio cadastro.
--
--  O admin é identificado pelo e-mail. Se mudar, troque em TODAS as ocorrências
--  abaixo e na constante ADMIN_EMAIL do arquivo js/config.js.
-- ============================================================================

-- Função de conveniência: e-mail do usuário atual (minúsculas)
create or replace function public.jwt_email() returns text
  language sql stable as $$ select lower(auth.jwt() ->> 'email') $$;

-- É admin? (por e-mail) — ou coordenador cadastrado na tabela pessoas.
create or replace function public.eh_gestor() returns boolean
  language sql stable security definer set search_path = public as $$
  select
    public.jwt_email() = lower('nildeno.aragao@gmail.com')
    or exists (
      select 1 from public.pessoas
      where user_id = auth.uid()
        and papel in ('admin', 'coordenador')
        and ativo = true
    )
$$;

-- ---------------------------------------------------------------------------
alter table public.pessoas          enable row level security;
alter table public.grupos           enable row level security;
alter table public.grupo_membros    enable row level security;
alter table public.escalas          enable row level security;
alter table public.escala_itens     enable row level security;
alter table public.escala_alteracoes enable row level security;
alter table public.comunicados      enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.avisos_enviados  enable row level security;

-- ===== PESSOAS ============================================================
-- Todo logado vê a lista de pessoas (para montar grupos / ver quem toca).
create policy "pessoas leitura logado" on public.pessoas
  for select to authenticated using (true);
-- A própria pessoa edita o próprio cadastro; gestor edita todos.
create policy "pessoas escrita gestor ou dono" on public.pessoas
  for all to authenticated
  using (public.eh_gestor() or user_id = auth.uid())
  with check (public.eh_gestor() or user_id = auth.uid());

-- ===== GRUPOS / MEMBROS ===================================================
create policy "grupos leitura logado" on public.grupos
  for select to authenticated using (true);
create policy "grupos escrita gestor" on public.grupos
  for all to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

create policy "membros leitura logado" on public.grupo_membros
  for select to authenticated using (true);
create policy "membros escrita gestor" on public.grupo_membros
  for all to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

-- ===== ESCALAS / ITENS / ALTERAÇÕES =======================================
-- Logado lê escala PUBLICADA; gestor lê tudo (inclusive rascunho).
create policy "escalas leitura publicada ou gestor" on public.escalas
  for select to authenticated using (publicada = true or public.eh_gestor());
create policy "escalas escrita gestor" on public.escalas
  for all to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

create policy "itens leitura publicada ou gestor" on public.escala_itens
  for select to authenticated using (
    public.eh_gestor()
    or exists (select 1 from public.escalas e where e.id = escala_id and e.publicada = true)
  );
create policy "itens escrita gestor" on public.escala_itens
  for all to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

create policy "alteracoes leitura logado" on public.escala_alteracoes
  for select to authenticated using (true);
create policy "alteracoes escrita gestor" on public.escala_alteracoes
  for all to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

-- ===== COMUNICADOS ========================================================
create policy "comunicados leitura logado" on public.comunicados
  for select to authenticated using (publicado = true or public.eh_gestor());
create policy "comunicados escrita gestor" on public.comunicados
  for all to authenticated using (public.eh_gestor()) with check (public.eh_gestor());

-- ===== PUSH SUBSCRIPTIONS =================================================
-- Cada pessoa gerencia apenas as próprias inscrições.
create policy "push leitura dono ou gestor" on public.push_subscriptions
  for select to authenticated using (
    public.eh_gestor()
    or pessoa_id in (select id from public.pessoas where user_id = auth.uid())
  );
create policy "push insere dono" on public.push_subscriptions
  for insert to authenticated with check (
    pessoa_id in (select id from public.pessoas where user_id = auth.uid())
  );
create policy "push apaga dono ou gestor" on public.push_subscriptions
  for delete to authenticated using (
    public.eh_gestor()
    or pessoa_id in (select id from public.pessoas where user_id = auth.uid())
  );

-- ===== AVISOS_ENVIADOS ====================================================
-- Só leitura para gestores; a escrita é feita pela Edge Function (service role,
-- que ignora RLS). Nenhuma política de escrita para usuários comuns.
create policy "avisos leitura gestor" on public.avisos_enviados
  for select to authenticated using (public.eh_gestor());
