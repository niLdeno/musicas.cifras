// ============================================================================
//  Comparativo com referências de mercado (CDI, inflação/IPCA, Ibovespa).
//
//  Pergunta respondida: "e se eu tivesse colocado o MESMO dinheiro, nas MESMAS
//  datas, em outro investimento?" Cada compra vira um aporte e cada venda ou
//  provento recebido vira um resgate na simulação. Assim a comparação é justa:
//  o dinheiro que entrou depois rende menos tempo, nos dois lados.
//
//  Todas as séries viram uma "curva de nível" (quanto R$ 1 vale ao longo do
//  tempo); o fator entre duas datas é nível(fim) / nível(início).
// ============================================================================
import { ordenarLancamentos } from './portfolio.js';

const DIA_MS = 86400000;
const dias = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DIA_MS);
const somarDias = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * DIA_MS).toISOString().slice(0, 10);

export const REFERENCIAS = {
  cdi:  { nome: 'CDI', descricao: 'renda fixa (ex.: Tesouro Selic, CDB 100% do CDI)' },
  ipca: { nome: 'Inflação (IPCA)', descricao: 'só repor o poder de compra' },
  ibov: { nome: 'Ibovespa', descricao: 'a média da bolsa (ex.: BOVA11)' },
};

// ---------------------------------------------------------------------------
//  Construção das curvas
// ---------------------------------------------------------------------------

/**
 * CDI: taxas diárias em % ([['AAAA-MM-DD', 0.0551], ...]). O dinheiro aplicado
 * num dia rende a taxa daquele dia em diante. Fim de semana/feriado: "degrau"
 * (vale o nível do próximo dia útil).
 */
export function curvaDeTaxasDiarias(lista) {
  const ord = [...lista].sort((a, b) => a[0].localeCompare(b[0]));
  const pontos = [];
  let nivel = 1;
  for (const [d, taxa] of ord) {
    pontos.push([d, nivel]);
    nivel *= 1 + taxa / 100;
  }
  if (ord.length) pontos.push([somarDias(ord[ord.length - 1][0], 1), nivel]);
  return { modo: 'degrau', pontos, ultimoDado: ord[ord.length - 1]?.[0] || null };
}

/**
 * IPCA: variação mensal em % ([['AAAA-MM', 0.42], ...]). Distribuída ao longo
 * dos dias do mês (como faz o Tesouro IPCA+). Meses ainda não divulgados
 * repetem a última taxa conhecida (estimativa) até `ate`.
 */
export function curvaDeTaxasMensais(lista, ate) {
  const ord = [...lista].sort((a, b) => a[0].localeCompare(b[0]));
  if (!ord.length) return { modo: 'interp', pontos: [], ultimoDado: null, estimadoDesde: null };
  const mapa = new Map(ord);
  const ultimaTaxa = ord[ord.length - 1][1];
  const ultimoMes = ord[ord.length - 1][0];
  const mesFinal = (ate || ultimoMes).slice(0, 7);
  const pontos = [];
  let nivel = 1;
  let [a, m] = ord[0][0].split('-').map(Number);
  for (;;) {
    const mes = `${a}-${String(m).padStart(2, '0')}`;
    pontos.push([`${mes}-01`, nivel]);
    if (mes > mesFinal && mes > ultimoMes) break;
    nivel *= 1 + (mapa.has(mes) ? mapa.get(mes) : ultimaTaxa) / 100;
    if (++m > 12) { m = 1; a++; }
  }
  return { modo: 'interp', pontos, ultimoDado: ultimoMes, estimadoDesde: mesFinal > ultimoMes ? proximoMes(ultimoMes) : null };
}

/** Ibovespa (ou qualquer preço): [['AAAA-MM-DD', pontos], ...]. */
export function curvaDeNiveis(lista) {
  const ord = [...lista].filter(([, v]) => v > 0).sort((a, b) => a[0].localeCompare(b[0]));
  return { modo: 'interp', pontos: ord, ultimoDado: ord[ord.length - 1]?.[0] || null };
}

function proximoMes(anoMes) {
  let [a, m] = anoMes.split('-').map(Number);
  if (++m > 12) { m = 1; a++; }
  return `${a}-${String(m).padStart(2, '0')}`;
}

/** Nível da curva numa data; null se a data é anterior ao início dos dados. */
export function nivelEm(curva, data) {
  const p = curva?.pontos;
  if (!p?.length || data < p[0][0]) return null;
  // busca binária: último ponto com data <= alvo
  let lo = 0;
  let hi = p.length - 1;
  while (lo < hi) {
    const meio = (lo + hi + 1) >> 1;
    if (p[meio][0] <= data) lo = meio; else hi = meio - 1;
  }
  if (lo === p.length - 1) return p[lo][1];
  if (curva.modo === 'degrau') return p[lo][0] === data ? p[lo][1] : p[lo + 1][1];
  const [d0, n0] = p[lo];
  const [d1, n1] = p[lo + 1];
  const f = dias(d0, data) / dias(d0, d1);
  return n0 * (n1 / n0) ** f;
}

// ---------------------------------------------------------------------------
//  Fluxos de caixa e simulação
// ---------------------------------------------------------------------------

/**
 * Dinheiro que entrou (+) e saiu (−) da carteira, do ponto de vista dela:
 * compra = aporte; venda e provento recebido = resgate.
 */
export function fluxosDaCarteira(lancamentos, proventos = []) {
  const out = [];
  for (const l of ordenarLancamentos(lancamentos)) {
    const bruto = (Number(l.quantidade) || 0) * (Number(l.preco) || 0);
    const taxas = Number(l.taxas) || 0;
    if (l.tipo === 'compra') out.push({ data: l.data, valor: bruto + taxas, tipo: 'compra' });
    else if (l.tipo === 'venda') out.push({ data: l.data, valor: -(bruto - taxas), tipo: 'venda' });
  }
  for (const p of proventos) out.push({ data: p.data, valor: -(Number(p.valor) || 0), tipo: 'provento' });
  return out.sort((a, b) => a.data.localeCompare(b.data));
}

/** Saldo em `ate` se cada fluxo tivesse seguido a curva. null se faltar dado. */
export function simular(fluxos, curva, ate) {
  const nFim = nivelEm(curva, ate);
  if (nFim == null) return null;
  let saldo = 0;
  for (const f of fluxos) {
    if (f.data > ate) break;
    const n0 = nivelEm(curva, f.data);
    if (n0 == null) return null;
    saldo += f.valor * (nFim / n0);
  }
  return saldo;
}

/**
 * TIR (taxa interna de retorno) anualizada — a rentabilidade "ponderada pelo
 * dinheiro": considera quanto e QUANDO cada real entrou ou saiu.
 * @param fluxos  do ponto de vista do investidor: aporte < 0, resgate > 0
 */
export function tir(fluxos) {
  const f = fluxos.filter((x) => Math.abs(x.valor) > 1e-9);
  if (f.length < 2 || !f.some((x) => x.valor < 0) || !f.some((x) => x.valor > 0)) return null;
  const t0 = f[0].data;
  const anos = f.map((x) => dias(t0, x.data) / 365);
  const vpl = (r) => f.reduce((s, x, i) => s + x.valor / (1 + r) ** anos[i], 0);

  // bisseção robusta em [-99,9%, +10.000%] a.a.
  let lo = -0.999;
  let hi = 100;
  let vlo = vpl(lo);
  if (Number.isNaN(vlo) || vlo * vpl(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const meio = (lo + hi) / 2;
    const v = vpl(meio);
    if (Math.abs(v) < 1e-7 || hi - lo < 1e-10) return meio;
    if (v * vlo > 0) { lo = meio; vlo = v; } else hi = meio;
  }
  return (lo + hi) / 2;
}

const paraInvestidor = (fluxos, valorFinal, hoje) => [
  ...fluxos.map((f) => ({ data: f.data, valor: -f.valor })),
  { data: hoje, valor: valorFinal },
];

/**
 * Compara a carteira com cada referência disponível.
 * @param {{ fluxos, patrimonio, hoje, curvas: { cdi?, ipca?, ibov? } }} p
 */
export function comparar({ fluxos, patrimonio, hoje, curvas }) {
  const aportes = fluxos.filter((f) => f.valor > 0).reduce((s, f) => s + f.valor, 0);
  const resgates = -fluxos.filter((f) => f.valor < 0).reduce((s, f) => s + f.valor, 0);
  const liquido = aportes - resgates; // dinheiro "do seu bolso" que ficou investido
  const inicio = fluxos[0]?.data || hoje;
  const prazoDias = dias(inicio, hoje);

  const carteira = {
    valorFinal: patrimonio,
    ganho: patrimonio - liquido,
    tir: tir(paraInvestidor(fluxos, patrimonio, hoje)),
  };

  const refs = {};
  for (const [k, curva] of Object.entries(curvas || {})) {
    if (!curva) continue;
    const saldo = simular(fluxos, curva, hoje);
    if (saldo == null) { refs[k] = { indisponivel: true, desde: curva.pontos?.[0]?.[0] || null }; continue; }
    const ganho = saldo - liquido;
    refs[k] = {
      valorFinal: saldo,
      ganho,
      tir: tir(paraInvestidor(fluxos, saldo, hoje)),
      diferenca: patrimonio - saldo, // > 0: a carteira foi melhor
      percentualDoGanho: ganho > 0.005 ? carteira.ganho / ganho : null, // ex.: "150% do CDI"
    };
  }

  return {
    inicio, prazoDias, aportes, resgates, liquido, carteira, refs,
    // Ganho real: quanto sobrou acima do que só repõe a inflação
    ganhoReal: refs.ipca && !refs.ipca.indisponivel ? patrimonio - refs.ipca.valorFinal : null,
  };
}

/** Série mensal "se fosse X" para o gráfico. Valores null onde falta dado. */
export function evolucaoComparada(fluxos, curvas, meses, fimDoMes, hoje) {
  return meses.map((mes) => {
    const fim = fimDoMes(mes) > hoje ? hoje : fimDoMes(mes);
    const linha = { mes, data: fim };
    for (const [k, curva] of Object.entries(curvas)) linha[k] = curva ? simular(fluxos, curva, fim) : null;
    linha.liquido = fluxos.filter((f) => f.data <= fim).reduce((s, f) => s + f.valor, 0);
    return linha;
  });
}
