// ============================================================================
//  Imposto de Renda sobre ganho de capital em operações comuns (swing trade),
//  pessoa física, regras vigentes da Receita Federal:
//   • Ações: isenção quando o total VENDIDO em ações no mês ≤ R$ 20.000;
//     acima disso, 15% sobre o lucro.
//   • ETFs e BDRs: 15%, sem isenção (somam-se às ações tributáveis).
//   • FIIs: 20%, sem isenção, prejuízo compensado só com lucro de FII.
//   • Prejuízos são acumulados e abatidos de lucros futuros da mesma categoria.
//   • DARF (código 6015) abaixo de R$ 10 não é pago: acumula para o mês seguinte.
//  Day trade tem regras próprias (20%, PM do dia) e NÃO é calculado aqui.
//  É uma ferramenta de apoio: confira sempre com seu contador/informe da corretora.
// ============================================================================
import { arred } from './money.js';

export const REGRAS_IR = {
  limiteIsencaoAcoes: 20000,
  aliquotaComum: 0.15,
  aliquotaFii: 0.20,
  darfMinimo: 10,
  codigoDarf: '6015',
};

/** Último dia útil (seg–sex) do mês seguinte — vencimento do DARF (sem feriados). */
export function vencimentoDarf(anoMes) {
  const [a, m] = anoMes.split('-').map(Number);
  const d = new Date(Date.UTC(a, m + 1, 0)); // último dia do mês seguinte
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {Array} vendas  saída de processarLancamentos().vendas
 * @returns {Array} um item por mês com vendas, em ordem cronológica
 */
export function apurarIR(vendas, regras = REGRAS_IR) {
  const porMes = new Map();
  for (const v of vendas) {
    const mes = v.data.slice(0, 7);
    if (!porMes.has(mes)) porMes.set(mes, []);
    porMes.get(mes).push(v);
  }

  let prejComum = 0;
  let prejFii = 0;
  let pendente = 0; // imposto < R$10 que ficou para depois
  const meses = [];

  for (const mes of [...porMes.keys()].sort()) {
    const lista = porMes.get(mes);
    const swing = lista.filter((v) => !v.dayTrade);
    const soma = (f) => swing.filter(f).reduce((s, v) => s + v.resultado, 0);

    const vendasAcoes = swing.filter((v) => v.classe === 'acao').reduce((s, v) => s + v.valorVenda, 0);
    const isento = vendasAcoes <= regras.limiteIsencaoAcoes;
    const resultadoAcoes = soma((v) => v.classe === 'acao');
    const resultadoEtfBdr = soma((v) => v.classe === 'etf' || v.classe === 'bdr');
    const resultadoFii = soma((v) => v.classe === 'fii');

    // Lucro de ações em mês isento não entra na conta; prejuízo entra (pode ser compensado depois).
    const lucroIsento = isento && resultadoAcoes > 0 ? resultadoAcoes : 0;
    const baseComum = (isento ? Math.min(resultadoAcoes, 0) : resultadoAcoes) + resultadoEtfBdr;

    const comum = compensar(baseComum, prejComum);
    prejComum = comum.prejuizo;
    const fii = compensar(resultadoFii, prejFii);
    prejFii = fii.prejuizo;

    const impostoComum = comum.tributavel * regras.aliquotaComum;
    const impostoFii = fii.tributavel * regras.aliquotaFii;
    const devidoNoMes = impostoComum + impostoFii;
    const totalDarf = devidoNoMes + pendente;
    const pagar = totalDarf >= regras.darfMinimo;

    meses.push({
      mes,
      operacoes: lista.length,
      dayTrades: lista.length - swing.length,
      vendasAcoes: arred(vendasAcoes),
      isento,
      lucroIsento: arred(lucroIsento),
      resultadoAcoes: arred(resultadoAcoes),
      resultadoEtfBdr: arred(resultadoEtfBdr),
      resultadoFii: arred(resultadoFii),
      compensadoComum: arred(comum.compensado),
      compensadoFii: arred(fii.compensado),
      baseComum: arred(comum.tributavel),
      baseFii: arred(fii.tributavel),
      prejuizoComumAcumulado: arred(prejComum),
      prejuizoFiiAcumulado: arred(prejFii),
      impostoComum: arred(impostoComum),
      impostoFii: arred(impostoFii),
      pendenteAnterior: arred(pendente),
      darf: arred(totalDarf),
      pagar,
      vencimento: pagar ? vencimentoDarf(mes) : null,
    });
    pendente = pagar ? 0 : totalDarf;
  }
  return meses;
}

function compensar(resultado, prejuizoAcumulado) {
  if (resultado <= 0) return { tributavel: 0, compensado: 0, prejuizo: prejuizoAcumulado - resultado };
  const compensado = Math.min(resultado, prejuizoAcumulado);
  return { tributavel: resultado - compensado, compensado, prejuizo: prejuizoAcumulado - compensado };
}

/**
 * Posição em 31/12 para a ficha "Bens e Direitos" da declaração anual:
 * quantidade e custo de aquisição (NUNCA o valor de mercado).
 */
export function bensEDireitos(ativosEm3112) {
  return [...ativosEm3112.values()]
    .filter((a) => a.quantidade > 0)
    .map((a) => ({ ticker: a.ticker, classe: a.classe, quantidade: a.quantidade, custo: arred(a.custo) }))
    .sort((x, y) => x.ticker.localeCompare(y.ticker));
}
