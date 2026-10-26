// ============================================================================
//  Motor da carteira (funções puras, sem DOM — cobertas por testes).
//
//  Preço médio pelo método da Receita Federal:
//   • Compra:   custo += qtd × preço + taxas;  PM = custo / quantidade
//   • Venda:    o PM NÃO muda; resultado = qtd × preço − taxas − qtd × PM
//   • Desdobramento/grupamento: a quantidade muda pelo fator, o custo não
//   • Bonificação: entra quantidade nova com o custo atribuído pela empresa
// ============================================================================
import { arred, EPS } from './money.js';
import { normalizarTicker, sugerirClasse } from './classes.js';

export const TIPOS_LANCAMENTO = {
  compra:        { nome: 'Compra',        ordem: 2 },
  venda:         { nome: 'Venda',         ordem: 3 },
  desdobramento: { nome: 'Desdobramento / Grupamento', ordem: 0 },
  bonificacao:   { nome: 'Bonificação',   ordem: 1 },
};

export const TIPOS_PROVENTO = {
  dividendo:  { nome: 'Dividendos' },
  jcp:        { nome: 'JCP' },
  rendimento: { nome: 'Rendimento (FII)' },
};

/** Ordem cronológica estável: data → tipo do evento no dia → ordem de cadastro. */
export function ordenarLancamentos(lista) {
  return [...lista].sort((a, b) =>
    a.data.localeCompare(b.data) ||
    (TIPOS_LANCAMENTO[a.tipo]?.ordem ?? 9) - (TIPOS_LANCAMENTO[b.tipo]?.ordem ?? 9) ||
    (a.criadoEm || 0) - (b.criadoEm || 0));
}

function novoEstado(ticker, classe) {
  return {
    ticker, classe,
    quantidade: 0, custo: 0, totalComprado: 0, totalVendido: 0,
    lucroRealizado: 0, primeiraCompra: null, ultimaMovimentacao: null,
  };
}

/**
 * Percorre os lançamentos em ordem e devolve o estado de cada ativo, as vendas
 * realizadas (base do IR) e os avisos de inconsistência.
 * @param {Array} lancamentos
 * @param {string} [ate] data limite (inclusive) 'AAAA-MM-DD'
 */
export function processarLancamentos(lancamentos, ate) {
  const ativos = new Map();
  const vendas = [];
  const avisos = [];
  const comprasPorDia = new Set();

  for (const l of ordenarLancamentos(lancamentos)) {
    if (ate && l.data > ate) break;
    const ticker = normalizarTicker(l.ticker);
    if (!ativos.has(ticker)) ativos.set(ticker, novoEstado(ticker, l.classe || sugerirClasse(ticker)));
    const a = ativos.get(ticker);
    if (l.classe) a.classe = l.classe;
    a.ultimaMovimentacao = l.data;

    const q = Number(l.quantidade) || 0;
    const preco = Number(l.preco) || 0;
    const taxas = Number(l.taxas) || 0;

    switch (l.tipo) {
      case 'compra': {
        const valor = q * preco + taxas;
        a.quantidade += q;
        a.custo += valor;
        a.totalComprado += valor;
        a.primeiraCompra ??= l.data;
        comprasPorDia.add(ticker + '|' + l.data);
        break;
      }
      case 'venda': {
        if (q > a.quantidade + EPS) {
          avisos.push({ id: l.id, ticker, data: l.data,
            msg: `Venda de ${q} ${ticker} em ${l.data}, mas só havia ${a.quantidade} em carteira.` });
        }
        const qVendida = Math.min(q, a.quantidade);
        const pm = a.quantidade > EPS ? a.custo / a.quantidade : 0;
        const custoVenda = qVendida * pm;
        const bruto = q * preco;
        const resultado = bruto - taxas - custoVenda;
        a.quantidade -= qVendida;
        a.custo -= custoVenda;
        if (a.quantidade < EPS) { a.quantidade = 0; a.custo = 0; }
        a.lucroRealizado += resultado;
        a.totalVendido += bruto - taxas;
        vendas.push({
          id: l.id, data: l.data, ticker, classe: a.classe,
          quantidade: q, preco, taxas, valorVenda: bruto, precoMedio: pm,
          custo: custoVenda, resultado,
          dayTrade: comprasPorDia.has(ticker + '|' + l.data),
        });
        break;
      }
      case 'desdobramento': {
        const fator = Number(l.fator) || 1;
        a.quantidade *= fator;
        break;
      }
      case 'bonificacao': {
        a.quantidade += q;
        a.custo += q * preco; // preço = custo unitário atribuído
        break;
      }
      default:
        avisos.push({ id: l.id, ticker, data: l.data, msg: `Tipo de lançamento desconhecido: ${l.tipo}` });
    }
  }
  return { ativos, vendas, avisos };
}

/** Soma proventos por ticker (total e últimos 12 meses a partir de `hoje`). */
export function agruparProventos(proventos, hoje = new Date().toISOString().slice(0, 10)) {
  const limite12m = deslocarMeses(hoje, -12);
  const mapa = new Map();
  for (const p of proventos) {
    const t = normalizarTicker(p.ticker);
    const g = mapa.get(t) || { total: 0, ultimos12m: 0 };
    const v = Number(p.valor) || 0;
    g.total += v;
    if (p.data > limite12m && p.data <= hoje) g.ultimos12m += v;
    mapa.set(t, g);
  }
  return mapa;
}

/**
 * Consolida a carteira: junta posição, cotação atual e proventos.
 * @param {{lancamentos:Array, proventos:Array, cotacoes:Object, hoje?:string}} p
 *        cotacoes = { TICKER: { preco, variacaoDia?, nome?, atualizadoEm?, manual? } }
 */
export function montarCarteira({ lancamentos, proventos = [], cotacoes = {}, hoje }) {
  const { ativos, vendas, avisos } = processarLancamentos(lancamentos);
  const provs = agruparProventos(proventos, hoje);

  const posicoes = [];
  for (const a of ativos.values()) {
    const prov = provs.get(a.ticker) || { total: 0, ultimos12m: 0 };
    const cot = cotacoes[a.ticker];
    const aberta = a.quantidade > EPS;
    const precoMedio = aberta ? a.custo / a.quantidade : 0;
    const temCotacao = !!(cot && Number.isFinite(cot.preco) && cot.preco > 0);
    const precoAtual = temCotacao ? cot.preco : precoMedio;
    const valorMercado = a.quantidade * precoAtual;
    const resultadoAberto = aberta ? valorMercado - a.custo : 0;
    const resultadoTotal = resultadoAberto + a.lucroRealizado + prov.total;

    posicoes.push({
      ticker: a.ticker,
      classe: a.classe,
      nome: cot?.nome || '',
      aberta,
      quantidade: a.quantidade,
      precoMedio,
      custo: a.custo,
      precoAtual,
      temCotacao,
      cotacaoManual: !!cot?.manual,
      cotacaoAtualizadaEm: cot?.atualizadoEm || null,
      variacaoDia: temCotacao && Number.isFinite(cot.variacaoDia) ? cot.variacaoDia : null,
      valorMercado,
      resultadoAberto,
      rentabilidadeAberta: aberta && a.custo > 0 ? resultadoAberto / a.custo : 0,
      lucroRealizado: a.lucroRealizado,
      proventos: prov.total,
      proventos12m: prov.ultimos12m,
      yieldOnCost: aberta && a.custo > 0 ? prov.ultimos12m / a.custo : 0,
      resultadoTotal,
      retornoTotal: a.totalComprado > 0 ? resultadoTotal / a.totalComprado : 0,
      totalComprado: a.totalComprado,
      primeiraCompra: a.primeiraCompra,
      peso: 0,
    });
  }

  // Proventos de ativos que nunca tiveram lançamento (ex.: cadastrados por engano)
  for (const [t, prov] of provs) {
    if (!ativos.has(t)) avisos.push({ ticker: t, msg: `Há proventos de ${t}, mas nenhuma compra registrada desse ativo.` });
  }

  const resumo = resumir(posicoes);
  for (const p of posicoes) p.peso = resumo.patrimonio > 0 ? p.valorMercado / resumo.patrimonio : 0;
  posicoes.sort((x, y) => y.valorMercado - x.valorMercado || x.ticker.localeCompare(y.ticker));

  return { posicoes, resumo, vendas, avisos, porClasse: agruparPorClasse(posicoes, resumo.patrimonio) };
}

function resumir(posicoes) {
  const r = {
    patrimonio: 0, custo: 0, resultadoAberto: 0, lucroRealizado: 0, proventos: 0, proventos12m: 0,
    resultadoTotal: 0, totalComprado: 0, variacaoDiaValor: 0, ativosAbertos: 0, semCotacao: 0,
    ganhando: 0, perdendo: 0,
  };
  for (const p of posicoes) {
    r.patrimonio += p.valorMercado;
    r.custo += p.custo;
    r.resultadoAberto += p.resultadoAberto;
    r.lucroRealizado += p.lucroRealizado;
    r.proventos += p.proventos;
    r.proventos12m += p.proventos12m;
    r.resultadoTotal += p.resultadoTotal;
    r.totalComprado += p.totalComprado;
    if (p.aberta) {
      r.ativosAbertos++;
      if (!p.temCotacao) r.semCotacao++;
      if (p.resultadoAberto > 0.005) r.ganhando++;
      else if (p.resultadoAberto < -0.005) r.perdendo++;
      if (p.variacaoDia != null) {
        // valor de ontem = hoje / (1 + var)
        r.variacaoDiaValor += p.valorMercado - p.valorMercado / (1 + p.variacaoDia);
      }
    }
  }
  r.rentabilidadeAberta = r.custo > 0 ? r.resultadoAberto / r.custo : 0;
  r.retornoTotal = r.totalComprado > 0 ? r.resultadoTotal / r.totalComprado : 0;
  r.variacaoDia = r.patrimonio - r.variacaoDiaValor > 0 ? r.variacaoDiaValor / (r.patrimonio - r.variacaoDiaValor) : 0;
  r.yieldOnCost = r.custo > 0 ? r.proventos12m / r.custo : 0;
  return r;
}

function agruparPorClasse(posicoes, patrimonio) {
  const m = new Map();
  for (const p of posicoes) {
    if (!p.aberta) continue;
    const g = m.get(p.classe) || { classe: p.classe, valorMercado: 0, custo: 0, resultadoAberto: 0, ativos: 0 };
    g.valorMercado += p.valorMercado;
    g.custo += p.custo;
    g.resultadoAberto += p.resultadoAberto;
    g.ativos++;
    m.set(p.classe, g);
  }
  return [...m.values()].map((g) => ({ ...g, peso: patrimonio > 0 ? g.valorMercado / patrimonio : 0 }));
}

// ---------------------------------------------------------------------------
//  Datas (strings 'AAAA-MM-DD', sem fuso, para não "pular" dia)
// ---------------------------------------------------------------------------
export function deslocarMeses(dataISO, meses) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}

export function fimDoMes(anoMes) {
  const [a, m] = anoMes.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

/** Lista 'AAAA-MM' de `inicio` até `fim` (inclusive). */
export function mesesEntre(inicio, fim) {
  const out = [];
  let [a, m] = inicio.slice(0, 7).split('-').map(Number);
  const [af, mf] = fim.slice(0, 7).split('-').map(Number);
  while (a < af || (a === af && m <= mf)) {
    out.push(`${a}-${String(m).padStart(2, '0')}`);
    if (++m > 12) { m = 1; a++; }
  }
  return out;
}

/**
 * Evolução mês a mês do valor aplicado (custo da carteira em aberto) e dos
 * proventos recebidos. O patrimônio a mercado vem das "fotografias" diárias
 * salvas a cada atualização de cotação (ver data/store.js).
 */
export function evolucaoMensal(lancamentos, proventos, hoje) {
  if (!lancamentos.length) return [];
  const inicio = ordenarLancamentos(lancamentos)[0].data;
  return mesesEntre(inicio, hoje).map((mes) => {
    const fim = fimDoMes(mes);
    const { ativos } = processarLancamentos(lancamentos, fim);
    let custo = 0;
    for (const a of ativos.values()) custo += a.custo;
    const prov = proventos.filter((p) => p.data.startsWith(mes)).reduce((s, p) => s + (Number(p.valor) || 0), 0);
    return { mes, custo: arred(custo), proventos: arred(prov) };
  });
}
