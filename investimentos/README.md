# 📈 Minha Carteira — acompanhamento de investimentos

Aplicativo para acompanhar **ações, FIIs, ETFs e BDRs** da B3 de forma **profissional e didática**:
você registra suas operações e ele mostra, em linguagem simples, se cada papel está dando
**lucro ou prejuízo** e por quê.

> ✨ **Teste agora:** abra o app e clique em **"Explorar uma carteira de demonstração"**.

---

## O que ele faz

| Tela | Para que serve |
|---|---|
| **Painel** | Patrimônio, variação do dia, resultado em aberto, lucro realizado, proventos e resultado total, com um **resumo em português claro**. Gráficos de evolução do patrimônio, alocação por classe (com **metas**), lucro/prejuízo por ativo e destaques. |
| **Carteira** | Tabela de posições (vira cartões no celular): quantidade, preço médio, cotação, valor, lucro/prejuízo (R$ e %), proventos, yield on cost, resultado total e peso. Filtro, busca e ordenação. |
| **Ativo** | Explicação do resultado daquele papel, **linha do tempo** mostrando como cada operação mexeu no preço médio, proventos e cotação manual. |
| **Operações** | Compras, vendas, desdobramentos/grupamentos e bonificações. Importação e exportação em **CSV**. Detecta inconsistências (ex.: venda maior que a posição). |
| **Proventos** | Dividendos, JCP e rendimentos de FII por mês, ranking de pagadores e yield on cost. |
| **Valeu a pena?** | Compara a carteira com **CDI** (renda fixa), **inflação (IPCA)** e **Ibovespa**, simulando os **mesmos aportes, nas mesmas datas**. Mostra ganho de cada alternativa, **ganho real** (acima da inflação), "% do CDI" e a **rentabilidade ao ano (TIR)**, que considera quando cada real entrou. |
| **Imposto de Renda** | Apuração mensal: isenção de R$ 20 mil em ações, 15% (ações/ETF/BDR), 20% (FII), **compensação de prejuízos**, DARF mínimo de R$ 10 e vencimento. Ficha de **Bens e Direitos** em 31/12. |
| **Aprenda** | Glossário completo. Todo número do app tem um **ⓘ** que explica o conceito com exemplo. |

Também tem: tema claro/escuro, botão para **ocultar valores** (👁), funcionamento offline (PWA,
dá para "instalar" no celular) e acessibilidade (navegação por teclado, lucro/prejuízo sempre com
▲▼ e sinal, não só cor).

## Como os números são calculados

- **Preço médio** pelo método da Receita Federal: taxas entram no custo; vendas **não** mudam o
  preço médio; desdobramento muda a quantidade e mantém o custo.
- **Resultado em aberto** = valor de mercado − custo da posição (só vira real quando você vende).
- **Lucro realizado** = preço de venda × quantidade − taxas − preço médio × quantidade.
- **Resultado total** = em aberto + realizado + proventos.
- A fonte da verdade são as **operações**: a carteira é sempre recalculada a partir delas.

## Cotações

Vêm da [brapi.dev](https://brapi.dev) (dados da B3 com atraso de alguns minutos). Sem token só
alguns ativos de teste funcionam. **Crie um token gratuito** na brapi e cole em
**Configurações → Cotações automáticas**. Se faltar cotação de algum ativo, informe o preço
manualmente na página dele.

## Índices de comparação

- **CDI** (série 12) e **IPCA** (série 433): API pública do **Banco Central** (SGS), sem cadastro.
  O IPCA do mês ainda não divulgado é estimado repetindo a última taxa (o app avisa).
- **Ibovespa**: histórico diário pela brapi.dev. O tamanho do histórico depende do plano do token;
  se ele não cobrir a data do seu primeiro aporte, a comparação com o Ibovespa fica indisponível.
- Compras viram aportes e vendas/proventos viram resgates na simulação; por isso o "ganho total"
  da carteira é o mesmo "resultado total" do Painel.

## Privacidade e backup

Os dados ficam **somente no seu navegador** (localStorage). Nada é enviado a servidores, exceto
os códigos dos ativos para buscar cotações. Por isso, **baixe um backup** em Configurações de vez
em quando: ele também serve para levar a carteira para outro aparelho. O token nunca vai para o
backup.

## Rodar localmente

O app é 100% estático (HTML + JavaScript em módulos, sem etapa de build), mas precisa de um
servidor HTTP (módulos ES não funcionam abrindo o arquivo direto):

```bash
cd investimentos
npm start            # python3 -m http.server 8080 → http://localhost:8080
npm test             # testes de cálculo (Node 20+)
```

Publicando o repositório no GitHub Pages, o app fica em
`https://SEU_USUARIO.github.io/musicas.cifras/investimentos/`.

## Estrutura

```
investimentos/
├── index.html            # casca do app (com Content-Security-Policy)
├── css/styles.css        # design tokens (claro/escuro) e layout responsivo
├── js/
│   ├── app.js            # menu, rotas, tema, atualização de cotações
│   ├── core/             # regras de negócio PURAS (sem DOM) — cobertas por testes
│   │   ├── portfolio.js  #   preço médio, posições, resultados, evolução
│   │   ├── tax.js        #   apuração de IR e bens e direitos
│   │   ├── benchmark.js  #   CDI/IPCA/Ibovespa: simulação dos aportes e TIR
│   │   ├── validacao.js  #   validação de formulários, CSV e backup
│   │   ├── classes.js    #   classes de ativos e sugestão pelo ticker
│   │   ├── money.js      #   arredondamento e formatação pt-BR
│   │   └── glossario.js  #   textos didáticos
│   ├── data/             # persistência local, cotações (brapi), demonstração
│   ├── ui/               # utilitários de interface e gráficos (Chart.js)
│   └── views/            # uma tela por arquivo
├── tests/                # node --test
└── sw.js                 # cache offline
```

## Limitações conhecidas

- **Day trade** é detectado e sinalizado, mas o imposto dele não é calculado.
- Não importa automaticamente da B3/corretora (use o CSV).
- Vencimento do DARF considera fins de semana, mas não feriados.
- Não é recomendação de investimento. Confira o IR com os informes oficiais e, se precisar, com um contador.
