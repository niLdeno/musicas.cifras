// ============================================================================
//  Glossário didático: cada número do app tem um "ⓘ" que abre a explicação
//  daqui. Linguagem simples, com exemplo sempre que possível.
// ============================================================================

export const GLOSSARIO = {
  patrimonio: {
    titulo: 'Patrimônio (valor de mercado)',
    texto: 'Quanto a sua carteira vale hoje: a quantidade de cada ativo × o último preço negociado na bolsa. É o valor que você receberia, aproximadamente, se vendesse tudo agora.',
    exemplo: '100 ações de PETR4 cotadas a R$ 38,00 = R$ 3.800,00 de patrimônio.',
    secao: 'Básico',
  },
  valorAplicado: {
    titulo: 'Valor aplicado (custo)',
    texto: 'Quanto você pagou pelos ativos que ainda tem — incluindo corretagem e taxas. É a base para saber se você está ganhando ou perdendo.',
    exemplo: 'Comprou 100 ações a R$ 30,00 + R$ 5,00 de taxas = R$ 3.005,00 aplicados.',
    secao: 'Básico',
  },
  precoMedio: {
    titulo: 'Preço médio (PM)',
    texto: 'O custo médio de cada unidade que você tem, somando todas as compras e as taxas. Quando você vende, o preço médio NÃO muda — ele só muda quando você compra de novo. É assim que a Receita Federal manda calcular.',
    exemplo: '100 ações a R$ 30 + 100 ações a R$ 40 = preço médio de R$ 35 (sem taxas).',
    secao: 'Básico',
  },
  resultadoAberto: {
    titulo: 'Resultado em aberto (não realizado)',
    texto: 'A diferença entre o que a sua posição vale hoje e o que você pagou por ela. É um lucro ou prejuízo "no papel": ele só se torna real quando você vende. Até lá, ele sobe e desce com a cotação.',
    exemplo: 'Pagou R$ 3.000, hoje vale R$ 3.600 → +R$ 600 em aberto (+20%).',
    secao: 'Resultado',
  },
  rentabilidade: {
    titulo: 'Rentabilidade (%)',
    texto: 'O resultado dividido pelo valor aplicado. Serve para comparar ativos de tamanhos diferentes: ganhar R$ 100 sobre R$ 1.000 (10%) é melhor do que ganhar R$ 100 sobre R$ 10.000 (1%).',
    secao: 'Resultado',
  },
  lucroRealizado: {
    titulo: 'Lucro (ou prejuízo) realizado',
    texto: 'O resultado que você já "colocou no bolso" ao vender: preço de venda − preço médio − taxas. Ele não muda mais, e é sobre ele que pode haver Imposto de Renda.',
    exemplo: 'PM de R$ 35, vendeu 50 ações a R$ 45 → lucro realizado de R$ 500.',
    secao: 'Resultado',
  },
  proventos: {
    titulo: 'Proventos',
    texto: 'Dinheiro que a empresa ou fundo distribui a quem tem o ativo: dividendos, Juros sobre Capital Próprio (JCP) e rendimentos de FIIs. É uma parte importante do seu ganho, que não aparece na cotação.',
    secao: 'Proventos',
  },
  dividendo: {
    titulo: 'Dividendos',
    texto: 'Parte do lucro da empresa distribuída aos acionistas. Para pessoa física, hoje são isentos de IR (confira mudanças na legislação).',
    secao: 'Proventos',
  },
  jcp: {
    titulo: 'JCP — Juros sobre Capital Próprio',
    texto: 'Outra forma de a empresa distribuir lucro. Diferente dos dividendos, já vem com 15% de IR descontado na fonte. Lance aqui o valor LÍQUIDO que caiu na sua conta.',
    secao: 'Proventos',
  },
  rendimento: {
    titulo: 'Rendimentos de FII',
    texto: 'Os aluguéis ou juros que o fundo imobiliário distribui, geralmente todo mês. Para pessoa física, costumam ser isentos de IR.',
    secao: 'Proventos',
  },
  yieldOnCost: {
    titulo: 'Yield on Cost (YoC)',
    texto: 'Quanto os proventos dos últimos 12 meses representam do que você pagou. Mostra a "renda" que o seu dinheiro está gerando, como se fosse um aluguel.',
    exemplo: 'Investiu R$ 10.000 e recebeu R$ 800 em 12 meses → YoC de 8% ao ano.',
    secao: 'Proventos',
  },
  resultadoTotal: {
    titulo: 'Resultado total',
    texto: 'A visão mais completa de quanto um investimento rendeu: resultado em aberto + lucro já realizado em vendas + proventos recebidos. Às vezes uma ação cai, mas pagou tantos dividendos que, no total, você ganhou.',
    secao: 'Resultado',
  },
  retornoTotal: {
    titulo: 'Retorno total (%)',
    texto: 'O resultado total dividido por tudo que você já investiu naquele ativo (todas as compras). Responde: "para cada R$ 100 que coloquei aqui, quanto ganhei ou perdi no total?"',
    secao: 'Resultado',
  },
  peso: {
    titulo: 'Peso na carteira',
    texto: 'Quanto aquele ativo representa do seu patrimônio total. Ajuda a ver se você está concentrado demais em uma só empresa ou setor.',
    secao: 'Carteira',
  },
  variacaoDia: {
    titulo: 'Variação do dia',
    texto: 'Quanto a cotação mudou desde o fechamento do pregão anterior. Oscilações diárias são normais na bolsa — para quem investe a longo prazo, o dia a dia importa pouco.',
    secao: 'Carteira',
  },
  diversificacao: {
    titulo: 'Diversificação',
    texto: '"Não colocar todos os ovos na mesma cesta." Ter ativos de classes, empresas e setores diferentes reduz o risco de um problema isolado afetar muito a sua carteira.',
    secao: 'Carteira',
  },
  rebalanceamento: {
    titulo: 'Metas de alocação e rebalanceamento',
    texto: 'Você define quanto quer em cada classe (ex.: 50% ações, 30% FIIs, 20% ETFs). Com o tempo, as altas e baixas desequilibram isso. Rebalancear é direcionar os próximos aportes para a classe que ficou abaixo da meta — uma forma disciplinada de "comprar barato".',
    secao: 'Carteira',
  },
  ticker: {
    titulo: 'Ticker (código do ativo)',
    texto: 'O código de negociação na B3: 4 letras + número. Final 3 = ação ordinária (ON, com voto), 4 = preferencial (PN), 11 = units, FIIs e ETFs, 34/35 = BDRs.',
    exemplo: 'PETR4, VALE3, HGLG11, BOVA11, AAPL34.',
    secao: 'Básico',
  },
  taxas: {
    titulo: 'Taxas e corretagem',
    texto: 'Custos de cada operação: corretagem (muitas corretoras zeraram), emolumentos e taxa de liquidação da B3. Estão na nota de corretagem. Elas entram no preço médio da compra e reduzem o lucro da venda.',
    secao: 'Básico',
  },
  desdobramento: {
    titulo: 'Desdobramento e grupamento',
    texto: 'Desdobramento: cada ação vira várias (fator 2 = cada 1 vira 2) e o preço cai na mesma proporção. Grupamento é o contrário (fator 0,1 = cada 10 viram 1). Seu patrimônio e seu custo total não mudam.',
    secao: 'Eventos',
  },
  bonificacao: {
    titulo: 'Bonificação',
    texto: 'A empresa dá ações novas aos acionistas. Ela informa um "custo atribuído" por ação, que entra no seu preço médio (use-o no campo de preço).',
    secao: 'Eventos',
  },
  isencao20k: {
    titulo: 'Isenção de R$ 20 mil (ações)',
    texto: 'Se o total de VENDAS de ações no mês (o valor vendido, não o lucro) for de até R$ 20.000, o lucro dessas vendas é isento de IR. Não vale para FIIs, ETFs, BDRs nem day trade.',
    secao: 'Imposto de Renda',
  },
  prejuizoCompensar: {
    titulo: 'Prejuízo a compensar',
    texto: 'Prejuízos com vendas não se perdem: eles ficam acumulados e são abatidos de lucros futuros, reduzindo o imposto. Prejuízo de FII só compensa lucro de FII.',
    secao: 'Imposto de Renda',
  },
  darf: {
    titulo: 'DARF',
    texto: 'A guia para pagar o IR sobre ganhos na bolsa (código 6015). É você quem calcula e paga, até o último dia útil do mês seguinte à venda. Valores abaixo de R$ 10 ficam acumulados para o próximo DARF.',
    secao: 'Imposto de Renda',
  },
  bensDireitos: {
    titulo: 'Bens e Direitos (declaração anual)',
    texto: 'Na declaração, cada ativo que você tinha em 31/12 é informado pela quantidade e pelo CUSTO DE AQUISIÇÃO (quantidade × preço médio) — nunca pelo valor de mercado.',
    secao: 'Imposto de Renda',
  },
  dayTrade: {
    titulo: 'Day trade',
    texto: 'Comprar e vender o mesmo ativo no mesmo dia. Tem alíquota de 20%, não tem isenção e usa regras próprias. Este app avisa quando detecta, mas não calcula o imposto de day trade.',
    secao: 'Imposto de Renda',
  },
};
