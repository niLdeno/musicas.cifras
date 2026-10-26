// ============================================================================
//  Carteira de demonstração — dados FICTÍCIOS, só para explorar o app.
//  Preços aproximados e ilustrativos; não são recomendação de investimento.
// ============================================================================
import { evolucaoMensal, montarCarteira, fimDoMes } from '../core/portfolio.js';
import { sugerirClasse } from '../core/classes.js';

const C = (data, ticker, quantidade, preco, taxas = 0) => ({ tipo: 'compra', data, ticker, quantidade, preco, taxas });
const V = (data, ticker, quantidade, preco, taxas = 0) => ({ tipo: 'venda', data, ticker, quantidade, preco, taxas });

const LANCAMENTOS = [
  C('2025-01-08', 'ITSA4', 300, 9.85, 2.1),
  C('2025-01-08', 'BBAS3', 100, 27.4, 1.9),
  C('2025-01-15', 'HGLG11', 15, 156.2, 1.5),
  C('2025-01-15', 'MXRF11', 400, 9.62, 1.4),
  C('2025-02-10', 'WEGE3', 80, 47.9, 2.3),
  C('2025-02-10', 'BOVA11', 30, 118.5, 2.0),
  C('2025-03-12', 'MGLU3', 200, 9.1, 1.2),
  C('2025-03-20', 'TAEE11', 100, 34.2, 2.0),
  C('2025-04-14', 'PETR4', 150, 33.7, 2.4),
  C('2025-05-06', 'IVVB11', 15, 345.0, 2.6),
  C('2025-05-20', 'KNRI11', 12, 141.3, 1.2),
  C('2025-06-11', 'VALE3', 60, 54.8, 1.9),
  C('2025-07-09', 'ITSA4', 200, 10.6, 1.4),
  C('2025-08-05', 'MXRF11', 300, 9.4, 1.0),
  V('2025-08-21', 'MGLU3', 200, 7.35, 1.1),           // prejuízo realizado
  C('2025-09-15', 'BBAS3', 100, 22.9, 1.7),
  C('2025-10-08', 'HGLG11', 10, 159.8, 1.1),
  C('2025-11-12', 'AAPL34', 40, 61.5, 1.6),
  C('2025-12-03', 'WEGE3', 40, 44.1, 1.5),
  C('2026-01-14', 'PETR4', 100, 31.9, 1.8),
  V('2026-02-18', 'WEGE3', 60, 52.3, 1.6),            // lucro em mês isento (< R$ 20 mil vendidos)
  C('2026-03-10', 'BOVA11', 20, 131.2, 1.7),
  V('2026-04-15', 'KNRI11', 12, 152.0, 1.0),          // lucro em FII → DARF de 20%
  C('2026-05-07', 'TAEE11', 50, 36.8, 1.3),
  C('2026-06-16', 'VALE3', 40, 57.1, 1.4),
  C('2026-07-22', 'IVVB11', 5, 372.0, 1.1),
  C('2026-08-12', 'MXRF11', 300, 9.75, 1.0),
  C('2026-09-09', 'ITSA4', 150, 11.2, 1.2),
];

const COTACOES = {
  ITSA4:  { preco: 11.48, variacaoDia: 0.0062, nome: 'Itaúsa' },
  BBAS3:  { preco: 21.75, variacaoDia: -0.0118, nome: 'Banco do Brasil' },
  HGLG11: { preco: 163.4, variacaoDia: 0.0021, nome: 'CSHG Logística FII' },
  MXRF11: { preco: 9.58, variacaoDia: -0.0010, nome: 'Maxi Renda FII' },
  WEGE3:  { preco: 49.6, variacaoDia: 0.0143, nome: 'WEG' },
  BOVA11: { preco: 136.9, variacaoDia: 0.0071, nome: 'iShares Ibovespa' },
  TAEE11: { preco: 37.9, variacaoDia: 0.0034, nome: 'Taesa' },
  PETR4:  { preco: 30.85, variacaoDia: -0.0215, nome: 'Petrobras PN' },
  IVVB11: { preco: 389.5, variacaoDia: 0.0049, nome: 'iShares S&P 500' },
  VALE3:  { preco: 58.2, variacaoDia: -0.0063, nome: 'Vale' },
  AAPL34: { preco: 68.9, variacaoDia: 0.0112, nome: 'Apple (BDR)' },
};

function proventosDemo(hoje) {
  const out = [];
  const add = (data, ticker, tipo, valor) => { if (data <= hoje) out.push({ data, ticker, tipo, valor }); };
  // FIIs pagam todo mês
  for (const mes of mesesDe('2025-02', '2026-10')) {
    const qMx = mes < '2025-09' ? 400 : mes < '2026-09' ? 700 : 1000;
    add(`${mes}-15`, 'MXRF11', 'rendimento', +(qMx * 0.1).toFixed(2));
    const qHg = mes < '2025-11' ? 15 : 25;
    add(`${mes}-14`, 'HGLG11', 'rendimento', +(qHg * 1.1).toFixed(2));
    if (mes >= '2025-06' && mes <= '2026-04') add(`${mes}-16`, 'KNRI11', 'rendimento', +(12 * 1.0).toFixed(2));
  }
  // Ações: dividendos/JCP trimestrais
  for (const [d, t, tipo, v] of [
    ['2025-04-01', 'ITSA4', 'jcp', 6.12], ['2025-07-01', 'ITSA4', 'jcp', 6.12], ['2025-10-01', 'ITSA4', 'jcp', 10.2],
    ['2026-01-02', 'ITSA4', 'jcp', 10.2], ['2026-04-01', 'ITSA4', 'dividendo', 45.5], ['2026-07-01', 'ITSA4', 'jcp', 10.2],
    ['2025-03-12', 'BBAS3', 'jcp', 38.4], ['2025-06-11', 'BBAS3', 'dividendo', 41.0], ['2025-12-11', 'BBAS3', 'jcp', 52.6],
    ['2026-06-10', 'BBAS3', 'dividendo', 48.3], ['2025-08-20', 'WEGE3', 'jcp', 14.6], ['2026-03-11', 'WEGE3', 'dividendo', 22.8],
    ['2025-05-28', 'TAEE11', 'dividendo', 98.0], ['2025-11-27', 'TAEE11', 'dividendo', 71.0], ['2026-05-27', 'TAEE11', 'dividendo', 142.5],
    ['2025-08-21', 'PETR4', 'dividendo', 175.5], ['2025-11-20', 'PETR4', 'jcp', 88.0], ['2026-02-20', 'PETR4', 'dividendo', 210.0],
    ['2026-05-20', 'PETR4', 'dividendo', 160.0], ['2025-09-10', 'VALE3', 'dividendo', 132.0], ['2026-03-12', 'VALE3', 'dividendo', 118.0],
  ]) add(d, t, tipo, v);
  return out;
}

function mesesDe(inicio, fim) {
  const out = [];
  let [a, m] = inicio.split('-').map(Number);
  const [af, mf] = fim.split('-').map(Number);
  while (a < af || (a === af && m <= mf)) { out.push(`${a}-${String(m).padStart(2, '0')}`); if (++m > 12) { m = 1; a++; } }
  return out;
}

/** CDI, IPCA e Ibovespa ILUSTRATIVOS para a demonstração (não são dados oficiais). */
function indicesDemo(hoje) {
  const cdi = [];
  const ibov = [];
  const d = new Date(Date.UTC(2025, 0, 1));
  let i = 0;
  while (d.toISOString().slice(0, 10) <= hoje) {
    const iso = d.toISOString().slice(0, 10);
    const sem = d.getUTCDay();
    if (sem !== 0 && sem !== 6) {
      const anual = iso < '2025-03-20' ? 0.1315 : iso < '2025-06-20' ? 0.1415 : 0.149;
      cdi.push([iso, +(((1 + anual) ** (1 / 252) - 1) * 100).toFixed(6)]);
      const t = i / 450;
      ibov.push([iso, Math.round(121000 * (1 + 0.17 * t) * (1 + Math.sin(i / 23) * 0.03 + Math.cos(i / 9) * 0.008))]);
      i++;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const ipcaTaxas = [0.16, 1.31, 0.56, 0.43, 0.26, 0.24, 0.26, -0.11, 0.48, 0.09, 0.18, 0.33,
    0.33, 0.62, 0.41, 0.38, 0.29, 0.22, 0.27, 0.15, 0.36];
  const ipca = mesesDe('2025-01', '2026-09').map((m, k) => [m, ipcaTaxas[k] ?? 0.3]).filter(([m]) => m < hoje.slice(0, 7));
  return { cdi, ipca, ibov, inicio: '2025-01-01', erros: {}, atualizadoEm: new Date().toISOString(), demo: true };
}

/** Monta o estado completo da demonstração, incluindo um histórico de patrimônio plausível. */
export function dadosDemo(hoje = new Date().toISOString().slice(0, 10)) {
  const agora = Date.now();
  const lancamentos = LANCAMENTOS.filter((l) => l.data <= hoje).map((l, i) => ({
    ...l, id: 'demo-l' + i, criadoEm: agora + i, classe: sugerirClasse(l.ticker), taxas: l.taxas,
  }));
  const proventos = proventosDemo(hoje).map((p, i) => ({ ...p, id: 'demo-p' + i, criadoEm: agora + i }));
  const atualizadoEm = new Date().toISOString();
  const cotacoes = Object.fromEntries(Object.entries(COTACOES).map(([t, c]) => [t, { ...c, atualizadoEm, manual: true, demo: true }]));

  // Histórico: custo real mês a mês + uma oscilação de mercado suave e determinística
  const { resumo } = montarCarteira({ lancamentos, proventos, cotacoes, hoje });
  const finalRent = resumo.custo > 0 ? resumo.patrimonio / resumo.custo - 1 : 0;
  const evo = evolucaoMensal(lancamentos, proventos, hoje);
  const fotografias = evo.map((e, i) => {
    const t = evo.length > 1 ? i / (evo.length - 1) : 1;
    const ruido = Math.sin(i * 1.7) * 0.035 + Math.cos(i * 0.9) * 0.02;
    const rent = finalRent * t + (i === evo.length - 1 ? 0 : ruido);
    const data = i === evo.length - 1 ? hoje : fimDoMes(e.mes);
    return { data, custo: e.custo, patrimonio: +(e.custo * (1 + rent)).toFixed(2) };
  });
  fotografias[fotografias.length - 1] = { data: hoje, custo: +resumo.custo.toFixed(2), patrimonio: +resumo.patrimonio.toFixed(2) };

  return {
    lancamentos, proventos, cotacoes, fotografias,
    indices: indicesDemo(hoje),
    config: { metas: { acao: 0.5, fii: 0.25, etf: 0.2, bdr: 0.05 }, demo: true },
  };
}
