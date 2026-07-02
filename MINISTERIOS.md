# 🎶 Acesso por ministério + fila de aprovação de músicas

Este documento substitui o modelo de **"Modo Editor" único** descrito em
`SEGURANCA.md` por um modelo com **vários ministérios**, cada um com login
próprio, mais uma **fila de solicitações** para inserir/ajustar músicas.

Como fica:

| | Visitante | Ministério (login próprio) | Administrador (você) |
|---|---|---|---|
| Ver músicas, repertórios, acordes | ✅ | ✅ | ✅ |
| Tocar / transpor / imprimir | ✅ | ✅ | ✅ |
| Criar/editar/excluir **seus próprios** repertórios | ❌ | ✅ | ✅ (qualquer um) |
| Ver/editar repertório de **outro** ministério | ❌ | ❌ | ✅ |
| Inserir música nova / ajustar música existente | ❌ | ✅ (vira **solicitação pendente**) | ✅ (direto, sem aprovação) |
| Aprovar/rejeitar/ajustar solicitações | ❌ | ❌ (só vê o status das próprias) | ✅ |
| Excluir música do acervo | ❌ | ❌ | ✅ |
| Cadastrar/gerenciar ministérios | ❌ | ❌ | ✅ |

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
  musica_id uuid references public.musicas(id),   -- só preenchido quando tipo = 'edicao'
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
```

> Se o e-mail do administrador mudar no futuro, troque nos dois lugares:
> aqui (todas as ocorrências de `nildeno.aragao@gmail.com`) e na constante
> `ADMIN_EMAIL` dentro do `index.html`.

---

## Passo 3 — Cadastrar um ministério

Criar o **login** de um ministério ainda exige um passo manual no painel do
Supabase (o app só usa a chave pública, então não consegue criar contas
sozinho) — é o mesmo passo que já era feito para o editor único:

1. Painel do Supabase → **Authentication → Users → Add user**.
2. Preencha e-mail e senha do ministério, marque **Auto Confirm User**.
3. Clique em **Create user**.

Depois disso, **vincular** aquele e-mail a um nome de ministério é feito
**dentro do próprio sistema**: entre como administrador → **Configurações**
→ seção **Ministérios** → "Adicionar ministério" (nome + o mesmo e-mail
criado no passo 2). Não precisa mexer em SQL para isso.

⚠️ Se o ministério trocar de e-mail depois (você editar o cadastro dele no
sistema), quem já estava logado precisa **sair e entrar de novo** — o login
antigo continua "lembrando" o e-mail anterior até relogar.

---

## Como funciona a fila de solicitações

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
