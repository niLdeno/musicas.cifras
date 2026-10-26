// ============================================================================
//  Cotações via brapi.dev (API brasileira com dados da B3, com atraso).
//  • Sem token: a brapi libera só alguns ativos de teste (PETR4, VALE3,
//    ITUB4, MGLU3). Crie um token gratuito em https://brapi.dev para liberar
//    os demais e cole-o em Configurações.
//  • Uma requisição por ativo (compatível com o plano gratuito), com
//    concorrência limitada e timeout. Falhas não apagam a última cotação.
// ============================================================================

const BASE = 'https://brapi.dev/api/quote/';
const TIMEOUT_MS = 10000;
const CONCORRENCIA = 3;

async function buscarUm(ticker, token) {
  const url = new URL(BASE + encodeURIComponent(ticker));
  if (token) url.searchParams.set('token', token);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (r.status === 401 || r.status === 403) throw new Error(token ? 'token inválido ou sem permissão' : 'precisa de token');
    if (r.status === 404) throw new Error('ativo não encontrado');
    if (r.status === 429) throw new Error('limite de consultas atingido');
    if (!r.ok) throw new Error(`erro ${r.status}`);
    const json = await r.json();
    const q = json?.results?.[0];
    const preco = Number(q?.regularMarketPrice);
    if (!Number.isFinite(preco) || preco <= 0) throw new Error('sem preço disponível');
    return {
      preco,
      variacaoDia: Number.isFinite(q.regularMarketChangePercent) ? q.regularMarketChangePercent / 100 : null,
      nome: q.longName || q.shortName || '',
      logo: q.logourl || '',
      atualizadoEm: q.regularMarketTime || new Date().toISOString(),
      manual: false,
    };
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('tempo esgotado');
    throw e;
  } finally {
    clearTimeout(t);
  }
}

/**
 * @returns {Promise<{ cotacoes: Object, falhas: Array<{ticker, motivo}> }>}
 */
export async function buscarCotacoes(tickers, token, aoProgredir) {
  const fila = [...new Set(tickers)];
  const cotacoes = {};
  const falhas = [];
  let feitos = 0;

  async function trabalhador() {
    while (fila.length) {
      const t = fila.shift();
      try { cotacoes[t] = await buscarUm(t, token); }
      catch (e) { falhas.push({ ticker: t, motivo: e.message || 'falha de rede' }); }
      aoProgredir?.(++feitos, tickers.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, fila.length) }, trabalhador));
  return { cotacoes, falhas };
}
