# 🎶 Acesso por ministério + fila de aprovação de músicas

Este documento substitui o modelo de **"Modo Editor" único** descrito em
`SEGURANCA.md` por um modelo com **vários ministérios**, cada um com login
próprio, mais uma **fila de solicitações** para inserir/ajustar músicas.

Como fica:

| | Visitante (sem login) | Ministério (login próprio) | Administrador (você) |
|---|---|---|---|
| Ver músicas, repertórios, acordes | ❌ | ✅ | ✅ |
| Tocar / transpor / imprimir | ❌ | ✅ | ✅ |
| Criar/editar/excluir **seus próprios** repertórios | ❌ | ✅ | ✅ (qualquer um) |
| Ver/editar repertório de **outro** ministério | ❌ | ❌ | ✅ |
| Inserir música nova / ajustar música existente | ❌ | ✅ (vira **solicitação pendente**) | ✅ (direto, sem aprovação) |
| Aprovar/rejeitar/ajustar solicitações | ❌ | ❌ (só vê o status das próprias) | ✅ |
| Excluir música do acervo | ❌ | ❌ | ✅ |
| Se cadastrar sozinho (vira **pedido de acesso pendente**) | ✅ | — | — |
| Aprovar/rejeitar pedidos de acesso de ministério | ❌ | ❌ | ✅ |
| Cadastrar/gerenciar ministérios manualmente | ❌ | ❌ | ✅ |
| Recuperar a própria senha por e-mail | — | ✅ | ✅ |

⚠️ Assim como antes: esconder botões no `index.html` não protege nada
sozinho — a proteção de verdade são as regras de **RLS** abaixo no Supabase.
**Siga os passos na ordem.**

---

## Passo 1 — Criar as tabelas novas

No painel do Supabase → **SQL Editor → New query**, rode:

```sql
-- ===== MINISTÉRIOS =====
create table public.ministerios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  criado_em timestamptz not null default now()
);

-- ===== REPERTÓRIOS GANHAM DONO =====
alter table public.repertorios
  add column ministerio_id uuid references public.ministerios(id) on delete set null;
  -- fica NULL para repertórios "Gerais" (ex.: criados por você, sem dono);
  -- se o ministério for removido depois, os repertórios dele viram "Geral"
  -- em vez de serem apagados.

-- ===== FILA DE SOLICITAÇÕES DE MÚSICA =====
create table public.solicitacoes_musica (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('nova', 'edicao')),
  musica_id bigint references public.musicas(id),   -- só preenchido quando tipo = 'edicao' (id de `musicas` é bigint, não uuid)
  ministerio_id uuid not null references public.ministerios(id) on delete cascade,
  -- se o ministério for removido, o histórico de solicitações dele some junto
  titulo text,
  autor text,
  tom_original text,
  momento_missa text,
  conteudo text,
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'rejeitada')),
  observacao_admin text,
  criado_em timestamptz not null default now(),
  revisado_em timestamptz
);

-- ===== PEDIDOS DE ACESSO (auto-cadastro de ministério) =====
create table public.solicitacoes_cadastro (
  id uuid primary key default gen_random_uuid(),
  nome_ministerio text not null,
  responsavel_nome text not null,
  responsavel_sobrenome text not null,
  email text not null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'rejeitada')),
  observacao_admin text,
  criado_em timestamptz not null default now(),
  revisado_em timestamptz
);

-- evita duas solicitações pendentes pro mesmo e-mail ao mesmo tempo
create unique index solicitacoes_cadastro_email_pendente_uidx
  on public.solicitacoes_cadastro (lower(email))
  where status = 'pendente';
```

---

## Passo 2 — Trocar as regras de RLS (⚠️ o passo mais importante)

Se você já rodou o `SEGURANCA.md` antigo, existem políticas de escrita do
tipo *"qualquer autenticado pode gravar em musicas/repertorios"*. Elas
**precisam ser removidas** antes de criar as novas — regras de RLS se somam
(quem passar em qualquer uma libera o acesso), então sem remover as antigas,
as novas regras mais restritas não valem de nada.

No **SQL Editor**, rode o bloco inteiro:

```sql
-- ---------- Limpa as políticas antigas ----------
drop policy if exists "escrita autenticada musicas" on public.musicas;
drop policy if exists "escrita autenticada repertorios" on public.repertorios;

-- ---------- MÚSICAS: só o administrador grava ----------
create policy "escrita somente admin musicas"
  on public.musicas for all
  to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'))
  with check (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'));

-- ---------- REPERTÓRIOS: admin ou dono do repertório ----------
create policy "escrita admin ou dono repertorios"
  on public.repertorios for all
  to authenticated
  using (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or ministerio_id in (
      select id from public.ministerios
      where lower(email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or ministerio_id in (
      select id from public.ministerios
      where lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ---------- MINISTÉRIOS ----------
alter table public.ministerios enable row level security;

create policy "leitura do proprio ministerio ou admin"
  on public.ministerios for select
  to authenticated
  using (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or lower(email) = lower(auth.jwt() ->> 'email')
  );

create policy "escrita somente admin ministerios"
  on public.ministerios for all
  to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'))
  with check (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'));

-- ---------- SOLICITAÇÕES DE MÚSICA ----------
alter table public.solicitacoes_musica enable row level security;

-- Ministério só cria solicitação em nome dele mesmo
create policy "ministerio cria propria solicitacao"
  on public.solicitacoes_musica for insert
  to authenticated
  with check (
    ministerio_id in (
      select id from public.ministerios
      where lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Admin vê tudo; ministério vê só as próprias
create policy "leitura admin ou proprio ministerio"
  on public.solicitacoes_musica for select
  to authenticated
  using (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or ministerio_id in (
      select id from public.ministerios
      where lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Só admin aprova/rejeita/ajusta ou apaga solicitações
create policy "admin decide solicitacoes"
  on public.solicitacoes_musica for update
  to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'))
  with check (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'));

create policy "admin apaga solicitacoes"
  on public.solicitacoes_musica for delete
  to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'));

-- ---------- PEDIDOS DE ACESSO (auto-cadastro) ----------
alter table public.solicitacoes_cadastro enable row level security;

-- Qualquer pessoa pode pedir acesso (o cadastro cria a conta no Supabase
-- Auth na hora, mas ela só funciona no sistema depois que isso for aprovado)
create policy "qualquer um solicita cadastro"
  on public.solicitacoes_cadastro for insert
  to anon, authenticated
  with check (true);

-- Dono do e-mail (pra ver o próprio status) ou admin (pra ver tudo)
create policy "leitura admin ou proprio email cadastro"
  on public.solicitacoes_cadastro for select
  to authenticated
  using (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or lower(email) = lower(auth.jwt() ->> 'email')
  );

-- Só admin aprova/rejeita
create policy "admin decide cadastros"
  on public.solicitacoes_cadastro for update
  to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'))
  with check (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'));
```

> Se o e-mail do administrador mudar no futuro, troque nos dois lugares:
> aqui (todas as ocorrências de `nildeno.aragao@gmail.com`) e na constante
> `ADMIN_EMAIL` dentro do `index.html`.

---

## Passo 3 — Configurar o e-mail de recuperação de senha no Supabase

A recuperação de senha ("Esqueci minha senha") usa o serviço de e-mail
padrão do Supabase — não precisa configurar SMTP para começar a usar, mas
tem **um ajuste obrigatório**:

1. Painel do Supabase → **Authentication → URL Configuration**.
2. Em **Redirect URLs**, adicione o endereço onde o sistema fica publicado
   (ex.: `https://nildeno.github.io/musicas.cifras/*`). Sem isso, o link do
   e-mail de recuperação é rejeitado pelo Supabase.
3. (Opcional, recomendado) Em **Authentication → Providers → Email**,
   deixe **Confirm email** ligado — assim o Supabase confirma que o e-mail
   que o ministério digitou no auto-cadastro é real, o que também deixa a
   recuperação de senha mais confiável.

---

## Passo 4 — Cadastrar um ministério

Agora existem **dois jeitos**:

### A) O próprio ministério se cadastra (recomendado)

Na tela de login do sistema, o ministério clica em **"Cadastre seu
ministério"**, preenche nome do ministério, nome/sobrenome do responsável,
e-mail e senha, e envia. Isso já cria a conta de verdade no Supabase Auth,
mas ela **não funciona ainda** — vira um pedido pendente que só você
aprova. Você vê os pedidos em **Configurações → Ministérios → "Cadastros
pendentes"**, pode ajustar o nome do ministério se quiser e clicar
**Aprovar** (ou **Rejeitar**, com um motivo opcional). Aprovando, o
ministério já consegue entrar na próxima tentativa.

⚠️ Se você **rejeitar**, a conta que a pessoa criou continua existindo no
Supabase Auth (o app não tem permissão pra apagar contas — isso exigiria a
chave "service role", que este sistema nunca usa no navegador por
segurança). Ela só fica "sem vínculo" e não consegue fazer nada no
sistema. Se quiser removê-la de vez, apague manualmente em
**Authentication → Users** no painel do Supabase.

### B) Você cadastra manualmente (como antes)

1. Painel do Supabase → **Authentication → Users → Add user**.
2. Preencha e-mail e senha do ministério, marque **Auto Confirm User**.
3. Clique em **Create user**.
4. Entre como administrador → **Configurações → Ministérios** → "Adicionar
   ministério" (nome + o mesmo e-mail criado acima).

⚠️ Se o ministério trocar de e-mail depois (você editar o cadastro dele no
sistema), quem já estava logado precisa **sair e entrar de novo** — o login
antigo continua "lembrando" o e-mail anterior até relogar.

---

## Passo 5 — Bloquear a leitura para quem não tem cadastro

Até aqui, **qualquer visitante** (sem login algum) ainda conseguia **ver**
músicas, repertórios e o dicionário de acordes — só a escrita é que exigia
login. Este passo fecha isso: só quem tem cadastro aprovado (admin ou
ministério) consegue ver qualquer coisa no sistema. Visitantes sem login
passam a ver só a tela pedindo para entrar ou se cadastrar.

No **SQL Editor**, rode:

```sql
-- ---------- Remove a leitura pública antiga ----------
drop policy if exists "leitura publica musicas" on public.musicas;
drop policy if exists "leitura publica repertorios" on public.repertorios;
drop policy if exists "leitura publica dicionario" on public.dicionario_acordes;

-- ---------- Só quem está cadastrado (admin ou ministério aprovado) lê ----------
create policy "leitura somente cadastrados musicas"
  on public.musicas for select
  to authenticated
  using (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or exists (select 1 from public.ministerios where lower(email) = lower(auth.jwt() ->> 'email'))
  );

create policy "leitura somente cadastrados repertorios"
  on public.repertorios for select
  to authenticated
  using (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or exists (select 1 from public.ministerios where lower(email) = lower(auth.jwt() ->> 'email'))
  );

create policy "leitura somente cadastrados dicionario"
  on public.dicionario_acordes for select
  to authenticated
  using (
    lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com')
    or exists (select 1 from public.ministerios where lower(email) = lower(auth.jwt() ->> 'email'))
  );

-- ---------- Aproveita e fecha uma folga que ficou aberta desde o SEGURANCA.md:
--            a escrita no dicionário ainda liberava para QUALQUER autenticado,
--            não só o admin. Agora fica igual à de músicas. ----------
drop policy if exists "escrita autenticada dicionario" on public.dicionario_acordes;
create policy "escrita somente admin dicionario"
  on public.dicionario_acordes for all
  to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'))
  with check (lower(auth.jwt() ->> 'email') = lower('nildeno.aragao@gmail.com'));
```

⚠️ Um ministério com cadastro **pendente** (ainda não aprovado) tecnicamente
já tem uma conta de login válida no Supabase (criada no auto-cadastro), mas
essa política de leitura também bloqueia ele — só entra quem está de fato
na tabela `ministerios` (ou seja, já aprovado). Isso é proposital: "ter
conta" e "estar aprovado" são coisas diferentes aqui.

---

## Como funciona a fila de solicitações (músicas)

- Quando um ministério cria ou ajusta uma música pela aba **Músicas**, o
  formulário é o mesmo de sempre, mas em vez de gravar direto no acervo, cria
  uma solicitação em **Solicitações** com status "Pendente".
- Você (admin) vê essas solicitações na aba **Solicitações**, com um aviso
  de quantas estão pendentes. Pode abrir cada uma, **editar qualquer campo**
  (corrigir tom, revisar a letra/cifra, etc.) e então:
  - **Aprovar** → publica no acervo (cria a música nova ou atualiza a
    existente) e marca a solicitação como "Aprovada".
  - **Rejeitar** → marca como "Rejeitada", com uma observação opcional
    explicando o motivo.
- O ministério que enviou só enxerga o status e a observação — não pode
  editar depois de enviar.

---

## Como funciona o auto-cadastro e a recuperação de senha

- **Cadastro:** ao enviar o formulário, o sistema já cria a conta de login
  (e-mail + senha) no Supabase e registra o pedido em "Cadastros
  pendentes". A pessoa é deslogada na hora — mesmo com a conta criada, ela
  não consegue usar nada até você aprovar. Se tentar entrar antes de você
  decidir, o sistema avisa que o cadastro está aguardando aprovação (ou
  que foi rejeitado, se for o caso).
- **Aprovação:** você revisa nome do ministério, responsável e e-mail, pode
  ajustar o nome antes de confirmar, e aprova ou rejeita.
- **Recuperar senha:** o ministério clica em "Esqueci minha senha" na tela
  de login, digita o e-mail, e recebe um link do Supabase para definir uma
  senha nova — sem precisar falar com você. Só funciona depois de
  configurado o Passo 3 acima (Redirect URLs).
