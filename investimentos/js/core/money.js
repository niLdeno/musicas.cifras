// ============================================================================
//  Dinheiro e números: arredondamento e formatação no padrão brasileiro.
//  Todos os cálculos usam Number; o arredondamento a centavos acontece só nas
//  "bordas" (resultados exibidos ou consolidados), evitando erro acumulado.
// ============================================================================

export const EPS = 1e-9;

/** Arredonda para `casas` decimais sem os erros clássicos de ponto flutuante. */
export function arred(valor, casas = 2) {
  const f = 10 ** casas;
  return Math.round((valor + Math.sign(valor) * EPS) * f) / f;
}

const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (min, max) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
const fmtPct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export const brl = (v) => fmtBRL.format(arred(v || 0));
export const num = (v, min = 0, max = 2) => fmtNum(min, max).format(v || 0);
export const qtd = (v) => fmtNum(0, 8).format(v || 0);
/** `v` é fração (0.1 = 10%). */
export const pct = (v) => (Number.isFinite(v) ? fmtPct.format(v) : '—');
export const compacto = (v) => 'R$ ' + fmtCompacto.format(v || 0);

/** Com sinal explícito: +R$ 10,00 / −R$ 5,00. */
export function brlSinal(v) {
  const r = arred(v || 0);
  if (r === 0) return brl(0);
  return (r > 0 ? '+' : '−') + fmtBRL.format(Math.abs(r));
}
export function pctSinal(v) {
  if (!Number.isFinite(v)) return '—';
  const r = arred(v, 6);
  if (r === 0) return pct(0);
  return (r > 0 ? '+' : '−') + fmtPct.format(Math.abs(r));
}

/** Converte texto digitado ("1.234,56", "1234.56", "R$ 12,3") em número. */
export function parseNumero(texto) {
  if (typeof texto === 'number') return texto;
  let s = String(texto ?? '').trim().replace(/[R$\s]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
}

/** -1, 0 ou 1 com tolerância de meio centavo. */
export function sinal(v) {
  if (v > 0.005) return 1;
  if (v < -0.005) return -1;
  return 0;
}
