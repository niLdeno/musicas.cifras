# 🎶 Escala da Música — Capela São Carlos Borromeu (CSCB)

Aplicativo para **gerenciar a escala mensal dos músicos**, publicar **comunicados**,
registrar **alterações** e enviar **lembretes automáticos** (começo da semana e no
dia da missa — manhã para as 12h, tarde para as 19h).

Feito para celular (é um **PWA** — dá para "instalar" na tela inicial) e também
funciona no computador. Substitui a escala em PDF que era refeita a cada mudança.

> ✨ **Abra e use agora, sem instalar nada:** o app já vem em **Modo Demonstração**,
> populado com a escala de **Agosto/2026**. Basta abrir o `index.html`.

---

## O que ele faz

| Recurso | Músico | Coordenação |
|---|---|---|
| Ver a escala do mês (grade igual à oficial, com as cores da legenda) | ✅ | ✅ |
| Ver comunicados e o histórico de alterações | ✅ | ✅ |
| Receber lembretes automáticos (push) | ✅ | ✅ |
| Ver "minha próxima escala" | ✅ | ✅ |
| Montar/editar a escala, publicar versões | ❌ | ✅ |
| Criar comunicados | ❌ | ✅ |
| Cadastrar grupos e pessoas | ❌ | ✅ |

**Legenda de status** (mesma da escala em PDF):
🔴 Escala sem Grupo · 🟢 Substituição por Inversão de Escala ·
🔵 Substituição · 🟠 Escala Específica devido a Solenidades.

---

## Como testar (Modo Demonstração)

1. Abra `escala/index.html` no navegador (ou publique a pasta — veja abaixo).
2. Escolha **Entrar como Coordenação** (edita tudo) ou **Entrar como Músico** (só vê).
3. Tudo funciona offline; os dados ficam **só no seu navegador**. Para zerar, é só
   limpar os dados do site.

O Modo Demonstração fica ativo enquanto o `js/config.js` não tiver as chaves do
Supabase preenchidas.

---

## Publicar (GitHub Pages)

A pasta `escala/` é 100% estática. Publicando o repositório no GitHub Pages, o app
fica em `https://SEU_USUARIO.github.io/musicas.cifras/escala/`.

---

## Conectar ao Supabase (produção)

Assim o app passa a ter **login de verdade**, dados compartilhados por todos e os
**disparos automáticos** de lembrete.

### 1) Banco de dados

No painel do Supabase → **SQL Editor**, rode nesta ordem os arquivos de `supabase/`:

1. `schema.sql` — tabelas, tipos e a view de escalados.
2. `policies.sql` — **RLS** (a proteção real; o admin é identificado pelo e-mail
   `nildeno.aragao@gmail.com` — se mudar, troque lá e no `config.js`).
3. `seed_agosto_2026.sql` — *(opcional)* carrega a escala da foto.

### 2) Ligar o app ao banco

Em `js/config.js`, preencha:

```js
SUPABASE_URL: 'https://SEU_PROJETO.supabase.co',
SUPABASE_ANON_KEY: 'sua-anon-key-publica',
```

Pronto: o app sai do Modo Demonstração e passa a usar o Supabase. O login vira
e-mail + senha (Supabase Auth), com "Esqueci minha senha".

### 3) Lembretes automáticos (Web Push)

Os disparos agendados precisam de um servidor — usamos **Edge Function + pg_cron**
do próprio Supabase. Passo a passo:

```bash
# a) gere o par de chaves VAPID (uma vez)
npx web-push generate-vapid-keys

# b) coloque a chave PÚBLICA em js/config.js -> VAPID_PUBLIC_KEY

# c) publique a função de envio
supabase functions deploy enviar-avisos --no-verify-jwt

# d) configure os segredos da função
supabase secrets set \
  CRON_SECRET="uma-senha-forte-qualquer" \
  VAPID_PUBLIC_KEY="...pública..." \
  VAPID_PRIVATE_KEY="...privada..." \
  VAPID_SUBJECT="mailto:voce@exemplo.com"
```

Depois, no **SQL Editor**:
1. Guarde o segredo do cron no **Vault** (não em texto puro), com a mesma senha do passo (d):
   ```sql
   select vault.create_secret('a-mesma-senha-do-CRON_SECRET', 'cron_secret');
   ```
2. Rode `supabase/cron.sql` — **trocando** `<PROJECT_REF>` pela referência do seu projeto.
   (A função lê o segredo do Vault em tempo de execução e não fica executável por usuários comuns.)

**Quando os avisos saem** (horário de Brasília):
- **Segunda, 08:00** → a todos os escalados da semana (sábado a sexta).
- **Todo dia, 08:00** → quem toca na missa das **12h** daquele dia.
- **Todo dia, 15:00** → quem toca na missa das **19h** daquele dia.

Para ajustar horários, edite os `cron.schedule(...)` em `cron.sql` (lembre: o cron
roda em **UTC** = BRT + 3h).

> Cada músico ativa o push uma vez, na aba **Notificações** do app (precisa permitir
> as notificações do navegador; no iPhone, adicione o app à Tela de Início antes).

---

## Estrutura do projeto

```
escala/
├── index.html            App (SPA, sem build)
├── manifest.webmanifest  PWA
├── sw.js                 Service worker (offline + recebe push)
├── css/styles.css        Design (claro/escuro, mobile-first)
├── js/
│   ├── config.js         ⚙️ Chaves e constantes (edite aqui)
│   ├── app.js            Boot, login, navegação
│   ├── util.js, ui.js    Datas/grade e componentes (toast/modal)
│   ├── push.js           Web Push (permissão/inscrição)
│   ├── data/             Camada de dados: mock (demo) + supa (Supabase)
│   └── views/            Telas: escala, comunicados, alterações, notificações, gestão
├── icons/                Ícones do PWA
└── supabase/
    ├── schema.sql · policies.sql · seed_agosto_2026.sql · cron.sql
    └── functions/enviar-avisos/index.ts   Edge Function de disparo
```

---

## E-mail como reforço (opcional)

O push é grátis e ideal para os lembretes de horário. Se quiser **também** enviar
por e-mail (fallback para quem não instalou o app), dá para estender a Edge Function
`enviar-avisos` para chamar um serviço como o **Resend** (plano gratuito) usando o
`p.email` de cada escalado — a lista de destinatários já é calculada pela função.

---

## Segurança em uma frase

Esconder botões não protege nada: quem manda é o **RLS** do `policies.sql`. Leitura
da escala publicada é liberada a qualquer logado; **escrever** (montar escala,
publicar, comunicar) é só do admin/coordenação. Cada pessoa só mexe nas próprias
inscrições de push.
