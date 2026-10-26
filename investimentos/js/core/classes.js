// ============================================================================
//  Classes de ativos negociados na B3 e sugestão automática a partir do ticker.
// ============================================================================

export const CLASSES = {
  acao: { nome: 'Ações',  singular: 'Ação',
    explica: 'Pedaço de uma empresa. Você vira sócio e participa dos lucros (dividendos) e da valorização.' },
  fii:  { nome: 'FIIs',   singular: 'FII',
    explica: 'Fundo Imobiliário: reúne dinheiro de muitos investidores para comprar imóveis ou títulos do setor. Costuma pagar rendimentos mensais.' },
  etf:  { nome: 'ETFs',   singular: 'ETF',
    explica: 'Fundo de índice: com um só papel você compra uma cesta de ativos (ex.: BOVA11 replica o Ibovespa).' },
  bdr:  { nome: 'BDRs',   singular: 'BDR',
    explica: 'Recibo negociado na B3 que representa ações de empresas estrangeiras (ex.: AAPL34 = Apple).' },
};

export const ORDEM_CLASSES = ['acao', 'fii', 'etf', 'bdr'];

// ETFs populares terminados em 11 (que, sem isso, seriam confundidos com FIIs).
const ETFS = new Set([
  'BOVA11', 'BOVV11', 'BOVB11', 'BOVX11', 'IVVB11', 'SMAL11', 'SMAC11', 'HASH11', 'DIVO11',
  'XBOV11', 'PIBB11', 'SPXI11', 'NASD11', 'GOLD11', 'ECOO11', 'FIND11', 'MATB11', 'BRAX11',
  'ACWI11', 'EURP11', 'XINA11', 'QBTC11', 'BITH11', 'ETHE11', 'IMAB11', 'IRFM11', 'B5P211',
  'FIXA11', 'DEBB11', 'NTNS11', 'LFTS11', 'WRLD11', 'TECK11', 'USTK11', 'BDIV11', 'SPXB11',
]);

// Units de empresas (ações compostas) que também terminam em 11.
const UNITS = new Set([
  'TAEE11', 'SANB11', 'KLBN11', 'ENGI11', 'ALUP11', 'BPAC11', 'SAPR11', 'IGTI11', 'TIET11',
  'CPLE11', 'ITSA11', 'BRBI11', 'AMAR11', 'SULA11', 'RNEW11', 'PPLA11', 'BIDI11', 'ENEV11',
]);

/** Normaliza o código: maiúsculas, sem espaços e sem o sufixo "F" do fracionário. */
export function normalizarTicker(t) {
  let s = String(t || '').toUpperCase().replace(/\s+/g, '');
  if (/^[A-Z0-9]{4}\d{1,2}F$/.test(s)) s = s.slice(0, -1);
  return s;
}

export function tickerValido(t) {
  return /^[A-Z0-9]{4}\d{1,2}$/.test(normalizarTicker(t));
}

/** Palpite da classe — o usuário sempre pode corrigir no lançamento. */
export function sugerirClasse(ticker) {
  const t = normalizarTicker(ticker);
  if (ETFS.has(t)) return 'etf';
  if (UNITS.has(t)) return 'acao';
  if (/(3[2-5]|39)$/.test(t)) return 'bdr';
  if (/11$/.test(t)) return 'fii';
  return 'acao';
}
