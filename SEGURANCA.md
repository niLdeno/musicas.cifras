# 🔒 Como proteger o sistema (passo a passo)

> 📖 **Atualização:** o sistema agora suporta múltiplos ministérios de
> música, cada um com login próprio, além do administrador. Este documento
> descreve só a conta do **administrador** (o que era chamado de "editor").
> Para cadastrar ministérios e ativar a fila de aprovação de músicas, veja
> **`MINISTERIOS.md`** — as regras de RLS de lá **substituem** as do Passo 2
> aqui embaixo (o Passo 2 deste arquivo ficou só como referência histórica).

O sistema agora tem um **"Modo Editor"**: visitantes só **leem** as músicas, e
para **criar / editar / excluir** é preciso **entrar com uma senha**.

> ⚠️ **Importante:** esconder os botões no `index.html` **não basta** — qualquer
> pessoa pode abrir o código-fonte. A segurança de verdade vem das regras
> abaixo no Supabase (**RLS**), que impedem qualquer gravação sem login,
> mesmo que alguém tente burlar pelo navegador. **Faça os 2 passos abaixo.**

---

## Passo 1 — Criar o usuário "editor"

1. Acesse o painel do Supabase → seu projeto.
2. Menu lateral: **Authentication → Users → Add user**.
3. Preencha:
   - **Email:** `nildeno.aragao@gmail.com`
     *(é o mesmo valor que está na constante `ADMIN_EMAIL` dentro do `index.html`.
     Se quiser usar outro e-mail, troque nos dois lugares.)*
   - **Password:** a senha que você vai compartilhar **só com quem pode editar**.
   - ✅ Marque **Auto Confirm User** (assim não precisa confirmar e-mail).
4. Clique em **Create user**.

Pronto: essa senha é a "senha de acesso" do editor. Para trocar a senha depois,
basta editar o usuário nesse mesmo painel — **não precisa mexer no código**.

---

## Passo 2 — Ligar a proteção no banco (RLS) ⚠️ substituído por `MINISTERIOS.md`

No painel do Supabase → **SQL Editor → New query**, cole o bloco abaixo e clique
em **Run**. Ele faz: **leitura liberada para todos**, **gravação só para quem
está logado** (o usuário editor).

```sql
-- ===== MÚSICAS =====
alter table public.musicas enable row level security;

create policy "leitura publica musicas"
  on public.musicas for select
  using (true);

create policy "escrita autenticada musicas"
  on public.musicas for all
  to authenticated
  using (true) with check (true);

-- ===== REPERTÓRIOS =====
alter table public.repertorios enable row level security;

create policy "leitura publica repertorios"
  on public.repertorios for select
  using (true);

create policy "escrita autenticada repertorios"
  on public.repertorios for all
  to authenticated
  using (true) with check (true);

-- ===== DICIONÁRIO DE ACORDES =====
alter table public.dicionario_acordes enable row level security;

create policy "leitura publica dicionario"
  on public.dicionario_acordes for select
  using (true);

create policy "escrita autenticada dicionario"
  on public.dicionario_acordes for all
  to authenticated
  using (true) with check (true);
```

> Se você já tiver criado políticas antes e der erro de "policy already exists",
> apague as antigas em **Authentication → Policies** e rode de novo.

---

## Como fica para você e para os amigos

| | Visitante (amigos) | Editor (você, com senha) |
|---|---|---|
| Ver músicas, repertórios, acordes | ✅ | ✅ |
| Tocar / transpor / imprimir | ✅ | ✅ |
| Criar / editar / excluir | ❌ (escondido **e** bloqueado pelo banco) | ✅ |

**Para entrar como editor:** clique no bloco **"Ministério de Música / Somente
leitura"** no rodapé do menu lateral → digite a senha → pronto, os botões de
edição aparecem. Para sair, clique no mesmo bloco (agora "Editor conectado").

A sessão fica salva no navegador, então você não precisa digitar a senha toda
hora — só depois de sair ou em outro dispositivo.

---

## ⚠️ Observação sobre o arquivo `SENHAS.txt`

O arquivo `SENHAS.txt` contém a **senha do banco de dados** (`senha de criação
SUPABASE`). Essa senha é sensível e **não deveria ficar guardada junto do código**
que você compartilha. Recomendo:

- Guardar essa senha em outro lugar (gerenciador de senhas) e **remover do
  repositório**.
- A `anon public key` e a URL do Supabase podem continuar no código — elas são
  públicas por natureza e, com o RLS ativado acima, não permitem gravação.
