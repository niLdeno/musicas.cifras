// ============================================================================
//  Índices de referência:
//   • CDI (série 12) e IPCA (série 433) — API pública do Banco Central (SGS),
//     gratuita e sem cadastro.
//   • Ibovespa (^BVSP) — histórico diário pela brapi.dev. O tamanho do
//     histórico depende do plano do token; sem histórico suficiente o
//     comparativo com o Ibovespa fica indisponível (CDI e IPCA continuam).
// ============================================================================

const SGS = (serie) => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados`;
const TIMEOUT_MS = 15000;

async function buscarJSON(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`erro ${r.status}`);
    return await r.json();
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'tempo esgotado' : e.message || 'falha de rede');
  } finally {
    clearTimeout(t);
  }
}

const isoParaBR = (iso) => iso.split('-').reverse().join('/');
const brParaISO = (br) => br.split('/').reverse().join('-');

/** O SGS limita consultas diárias a 10 anos: busca em janelas de 5 anos. */
async function buscarSGS(serie, inicio, fim) {
  const saida = [];
  let ini = inicio;
  while (ini <= fim) {
    const alvo = `${Number(ini.slice(0, 4)) + 5}${ini.slice(4).replace('-02-29', '-02-28')}`;
    const fimJanela = alvo < fim ? alvo : fim;
    const url = new URL(SGS(serie));
    url.searchParams.set('formato', 'json');
    url.searchParams.set('dataInicial', isoParaBR(ini));
    url.searchParams.set('dataFinal', isoParaBR(fimJanela));
    const json = await buscarJSON(url);
    if (!Array.isArray(json)) throw new Error('resposta inesperada do Banco Central');
    for (const { data, valor } of json) {
      const v = Number(String(valor).replace(',', '.'));
      if (Number.isFinite(v)) saida.push([brParaISO(data), v]);
    }
    if (fimJanela === fim) break;
    ini = new Date(Date.parse(fimJanela + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  }
  return saida;
}

export async function buscarCDI(inicio, fim) {
  return buscarSGS(12, inicio, fim);
}

export async function buscarIPCA(inicio, fim) {
  const lista = await buscarSGS(433, `${inicio.slice(0, 7)}-01`, fim);
  return lista.map(([d, v]) => [d.slice(0, 7), v]);
}

/** Tenta do maior período necessário para o menor que o plano permitir. */
export async function buscarIbovespa(inicio, token) {
  const anos = (Date.now() - Date.parse(inicio)) / (365.25 * 86400000);
  const faixas = ['3mo', '6mo', '1y', '2y', '5y', '10y'];
  const precisa = anos <= 0.25 ? '3mo' : anos <= 0.5 ? '6mo' : anos <= 1 ? '1y' : anos <= 2 ? '2y' : anos <= 5 ? '5y' : '10y';
  const tentativas = faixas.slice(0, faixas.indexOf(precisa) + 1).reverse();
  let ultimoErro = null;
  for (const range of tentativas) {
    try {
      const url = new URL('https://brapi.dev/api/quote/%5EBVSP');
      url.searchParams.set('range', range);
      url.searchParams.set('interval', '1d');
      if (token) url.searchParams.set('token', token);
      const json = await buscarJSON(url);
      const q = json?.results?.[0];
      const hist = (q?.historicalDataPrice || [])
        .filter((h) => Number(h.close) > 0)
        .map((h) => [new Date(h.date * 1000).toISOString().slice(0, 10), Number(h.close)]);
      if (Number(q?.regularMarketPrice) > 0) {
        hist.push([new Date(q.regularMarketTime || Date.now()).toISOString().slice(0, 10), Number(q.regularMarketPrice)]);
      }
      if (hist.length) return { lista: hist, range };
      ultimoErro = new Error('sem histórico');
    } catch (e) {
      ultimoErro = e;
    }
  }
  throw new Error(ultimoErro?.message === 'erro 401' ? 'precisa de token da brapi' : ultimoErro?.message || 'indisponível');
}

/** Busca os três, de forma independente: a falha de um não derruba os outros. */
export async function buscarIndices(inicio, fim, token) {
  const [cdi, ipca, ibov] = await Promise.allSettled([
    buscarCDI(inicio, fim), buscarIPCA(inicio, fim), buscarIbovespa(inicio, token),
  ]);
  const erros = {};
  if (cdi.status === 'rejected') erros.cdi = cdi.reason.message;
  if (ipca.status === 'rejected') erros.ipca = ipca.reason.message;
  if (ibov.status === 'rejected') erros.ibov = ibov.reason.message;
  return {
    cdi: cdi.value || null,
    ipca: ipca.value || null,
    ibov: ibov.value?.lista || null,
    inicio,
    erros,
    atualizadoEm: new Date().toISOString(),
  };
}
