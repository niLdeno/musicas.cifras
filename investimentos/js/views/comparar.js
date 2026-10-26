// ============================================================================
//  "Valeu a pena?" — a carteira comparada com CDI, inflação e Ibovespa,
//  simulando os mesmos aportes, nas mesmas datas.
// ============================================================================
import {
  REFERENCIAS, comparar, curvaDeTaxasDiarias, curvaDeTaxasMensais, curvaDeNiveis,
  evolucaoComparada, fluxosDaCarteira,
} from '../core/benchmark.js';
import { mesesEntre, fimDoMes } from '../core/portfolio.js';
import { brl, pct, brlSinal, sinal } from '../core/money.js';
import { buscarIndices } from '../data/indices.js';
import { store } from '../data/store.js';
import { esc, info, oc, delta, dataBR, mesCurto, mesLongo, toast, tempoRelativo } from '../ui/dom.js';
import { linhas, corSerie } from '../ui/graficos.js';

const COR = { carteira: 1, cdi: 2, ibov: 3, ipca: 4 };
const VALIDADE_MS = 12 * 3600 * 1000;
let buscando = null;

/** Calcula tudo o que as telas precisam; null se ainda não há o que comparar. */
export function dadosComparativo(ctx) {
  const { estado, carteira, hoje } = ctx;
  const fluxos = fluxosDaCarteira(estado.lancamentos, estado.proventos);
  if (!fluxos.some((f) => f.valor > 0)) return null;
  const ind = estado.indices;
  const curvas = {
    cdi: ind?.cdi?.length ? curvaDeTaxasDiarias(ind.cdi) : null,
    ipca: ind?.ipca?.length ? curvaDeTaxasMensais(ind.ipca, hoje) : null,
    ibov: ind?.ibov?.length ? curvaDeNiveis(ind.ibov) : null,
  };
  const r = comparar({ fluxos, patrimonio: carteira.resumo.patrimonio, hoje, curvas });
  return { fluxos, curvas, r, ind };
}

/** Baixa (ou renova) os índices quando necessário. Retorna true se atualizou. */
export async function garantirIndices(ctx, { forcar = false } = {}) {
  const { estado, hoje } = ctx;
  if (estado.config.demo || !estado.lancamentos.length || !navigator.onLine) return false;
  const primeiro = fluxosDaCarteira(estado.lancamentos, estado.proventos)[0]?.data;
  if (!primeiro) return false;
  const ind = estado.indices;
  const velho = !ind || ind.demo || Date.now() - Date.parse(ind.atualizadoEm) > VALIDADE_MS || ind.inicio > primeiro;
  if (!forcar && !velho) return false;
  if (buscando) return buscando;
  const inicio = new Date(Date.parse(primeiro + 'T00:00:00Z') - 7 * 86400000).toISOString().slice(0, 10);
  buscando = buscarIndices(inicio, hoje, estado.config.tokenBrapi)
    .then((novo) => {
      // mantém dados antigos de um índice se a nova busca dele falhou
      for (const k of ['cdi', 'ipca', 'ibov']) if (!novo[k] && ind?.[k] && !ind.demo) novo[k] = ind[k];
      store.salvarIndices(novo);
      return true;
    })
    .finally(() => { buscando = null; });
  return buscando;
}

// ---------------------------------------------------------------------------
export function renderComparar(main, ctx) {
  const dados = dadosComparativo(ctx);
  if (!dados) {
    main.innerHTML = `<div class="cartao vazio"><h2>Ainda não há o que comparar</h2>
      <p>Registre suas compras para ver se a sua carteira está rendendo mais que a renda fixa, a inflação e a média da bolsa.</p>
      <button class="btn primario" type="button" data-acao="novo">Registrar compra</button></div>`;
    return;
  }
  const { r, ind, fluxos, curvas } = dados;
  const semIndices = !ind || (!ind.cdi && !ind.ipca && !ind.ibov);

  main.innerHTML = `
    <section class="cartao explicacao">
      <p>💬 <b>E se você tivesse colocado o mesmo dinheiro, nas mesmas datas, em outro lugar?</b>
        Cada compra que você fez vira um aporte na simulação, e cada venda ou provento recebido vira um resgate.
        Assim a comparação é justa: o dinheiro que entrou depois rende menos tempo, dos dois lados. ${info('comparativo')}</p>
    </section>

    ${faixaStatus(ctx, ind)}

    ${semIndices ? '' : `
    <section class="cartao veredito">${veredito(r)}</section>

    <section class="comparativos">
      ${cartaoCarteira(r)}
      ${['cdi', 'ipca', 'ibov'].map((k) => cartaoRef(k, r, ind, curvas[k])).join('')}
    </section>

    <section class="cartao">
      <header class="cartao-cab"><h2>Evolução: sua carteira × alternativas</h2>${info('comparativo')}</header>
      <p class="legenda-grafico">Quanto você teria em cada mês em cada alternativa, com os mesmos aportes e resgates.</p>
      <div class="grafico alto"><canvas id="g-comparar" role="img" aria-label="Evolução da carteira comparada com CDI, Ibovespa e inflação"></canvas></div>
      <p class="nota-grafico" id="nota-comparar"></p>
    </section>`}

    <section class="cartao">
      <h2>Como ler estes números</h2>
      <dl class="glossario">
        <div><dt>Ganho total ${info('resultadoTotal')}</dt><dd>Quanto você tem hoje + o que já recebeu em vendas e proventos − tudo que aplicou. Já reflete juros, inflação, notícias e tudo mais que mexeu nos preços.</dd></div>
        <div><dt>Rentabilidade ao ano (TIR) ${info('tir')}</dt><dd>A taxa anual equivalente do seu dinheiro, considerando <b>quando</b> cada real entrou e saiu. É a forma justa de comparar com o CDI, que é uma taxa ao ano.</dd></div>
        <div><dt>Ganho real ${info('ganhoReal')}</dt><dd>O que sobra depois de descontar a inflação: o aumento de verdade no seu poder de compra.</dd></div>
        <div><dt>% do CDI ${info('cdi')}</dt><dd>Quanto o seu ganho representa do ganho que a renda fixa daria. Acima de 100%: a bolsa compensou o risco até aqui.</dd></div>
      </dl>
      <p class="dica">Importante: comparar só um período curto pode enganar. Ações oscilam muito mais que a renda fixa; o comparativo faz mais sentido em prazos de anos.</p>
    </section>`;

  if (!semIndices) desenharGrafico(main, ctx, dados);

  main.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-atualizar-indices]')) return;
    const b = e.target.closest('button');
    b.disabled = true;
    b.textContent = 'Buscando…';
    try {
      await garantirIndices(ctx, { forcar: true });
      const erros = store.get().indices?.erros || {};
      const n = Object.keys(erros).length;
      if (!n) toast('Índices atualizados.');
      else toast(`Atualizado, mas sem: ${Object.entries(erros).map(([k, v]) => `${REFERENCIAS[k].nome} (${v})`).join(', ')}`, 'aviso', 8000);
    } catch (err) {
      toast('Não foi possível buscar os índices: ' + err.message, 'erro');
      b.disabled = false;
      b.textContent = 'Tentar de novo';
    }
  });
}

function faixaStatus(ctx, ind) {
  if (ctx.estado.config.demo) {
    return '<div class="alerta aviso"><b>Demonstração:</b> CDI, IPCA e Ibovespa abaixo são <b>ilustrativos</b>, não são os dados oficiais. Na sua carteira real, eles vêm do Banco Central e da B3.</div>';
  }
  if (!ind) {
    return `<div class="alerta info"><b>Buscando índices…</b> CDI e IPCA vêm da API pública do Banco Central; o Ibovespa, da brapi.dev.
      <button type="button" class="btn" data-atualizar-indices>Buscar agora</button></div>`;
  }
  const erros = Object.entries(ind.erros || {});
  return `<div class="alerta info">Fontes: CDI e IPCA do <b>Banco Central</b>, Ibovespa da <b>brapi.dev</b> · atualizado ${tempoRelativo(ind.atualizadoEm)}
    ${erros.length ? `<br><b>Indisponível agora:</b> ${erros.map(([k, v]) => `${REFERENCIAS[k].nome} (${esc(v)})`).join(', ')}` : ''}
    <button type="button" class="btn-texto" data-atualizar-indices>Atualizar</button></div>`;
}

function veredito(r) {
  const frases = [];
  const g = r.carteira.ganho;
  frases.push(`Desde ${dataBR(r.inicio)}, você aplicou <b>${oc(brl(r.aportes))}</b>${r.resgates > 0.005 ? ` e recebeu de volta <b>${oc(brl(r.resgates))}</b> em vendas e proventos` : ''}. Hoje a carteira vale <b>${oc(brl(r.carteira.valorFinal))}</b>: ${sinal(g) >= 0 ? 'ganho' : 'perda'} total de ${delta(g)}.`);
  const cdi = r.refs.cdi;
  if (cdi && !cdi.indisponivel) {
    frases.push(`No CDI, os mesmos aportes renderiam ${delta(cdi.ganho)}. Você ficou ${oc(brl(Math.abs(cdi.diferenca)))} <b class="delta ${cdi.diferenca >= 0 ? 'ganho' : 'perda'}">${cdi.diferenca >= 0 ? 'acima ▲' : 'abaixo ▼'}</b> da renda fixa${cdi.percentualDoGanho != null && g > 0 ? ` (${pct(cdi.percentualDoGanho).replace(',00', '')} do CDI)` : ''}.`);
  }
  if (r.ganhoReal != null) {
    const inflacao = r.refs.ipca.ganho;
    frases.push(`A inflação do período “comeu” ${oc(brl(Math.max(0, inflacao)))}; seu <b>ganho real</b>, acima da inflação, é ${delta(r.ganhoReal)}.`);
  }
  const ibov = r.refs.ibov;
  if (ibov && !ibov.indisponivel) {
    frases.push(`Comparado à média da bolsa (Ibovespa), você ficou ${oc(brl(Math.abs(ibov.diferenca)))} <b class="delta ${ibov.diferenca >= 0 ? 'ganho' : 'perda'}">${ibov.diferenca >= 0 ? 'acima ▲' : 'abaixo ▼'}</b>.`);
  }
  return `<h2>Valeu a pena?</h2><p>${frases.join(' ')}</p>`;
}

const tirTexto = (t, prazoDias) => (t == null ? '—' : prazoDias < 90 ? 'prazo curto' : `${pct(t)} a.a.`);

function cartaoCarteira(r) {
  return `<article class="cartao comp principal-comp">
    <header><span class="marcador" style="background:${corSerie(COR.carteira)}"></span><h3>Sua carteira</h3></header>
    <span class="rotulo">Vale hoje</span>
    <strong class="kpi-valor">${oc(brl(r.carteira.valorFinal))}</strong>
    <dl>
      <div><dt>Ganho total</dt><dd>${delta(r.carteira.ganho)}</dd></div>
      <div><dt>Rentabilidade ${info('tir')}</dt><dd>${tirTexto(r.carteira.tir, r.prazoDias)}</dd></div>
    </dl>
  </article>`;
}

function cartaoRef(k, r, ind, curva) {
  const ref = r.refs[k];
  const cab = `<header><span class="marcador" style="background:${corSerie(COR[k])}"></span><h3>${REFERENCIAS[k].nome} ${info(k === 'ibov' ? 'ibovespa' : k)}</h3></header>
    <small class="sub-comp">${REFERENCIAS[k].descricao}</small>`;
  if (!ref || ref.indisponivel) {
    const motivo = ind?.erros?.[k] ? esc(ind.erros[k])
      : ref?.desde ? `histórico disponível só desde ${dataBR(ref.desde)} (seu 1º aporte é anterior)` : 'sem dados';
    return `<article class="cartao comp indisponivel">${cab}<p class="dica">Indisponível: ${motivo}.${k === 'ibov' ? ' O histórico do Ibovespa depende do plano do seu token da brapi.' : ''}</p></article>`;
  }
  const estimado = k === 'ipca' && curva?.estimadoDesde
    ? `<small class="bloco">IPCA oficial até ${mesLongo(curva.ultimoDado)}; depois, estimado</small>` : '';
  return `<article class="cartao comp">
    ${cab}
    <span class="rotulo">${k === 'ipca' ? 'Só para repor a inflação, valeria' : 'Com os mesmos aportes, teria'}</span>
    <strong class="kpi-valor">${oc(brl(ref.valorFinal))}</strong>
    <dl>
      <div><dt>${k === 'ipca' ? 'Inflação do período' : 'Ganho'}</dt><dd>${k === 'ipca' ? oc(brl(ref.ganho)) : delta(ref.ganho)}</dd></div>
      <div><dt>${k === 'ipca' ? 'Inflação' : 'Rentabilidade'}</dt><dd>${tirTexto(ref.tir, r.prazoDias)}</dd></div>
      <div><dt>Sua carteira ficou</dt><dd>${delta(ref.diferenca)} <small>${ref.diferenca >= 0 ? 'acima' : 'abaixo'}</small></dd></div>
    </dl>
    ${estimado}
  </article>`;
}

function desenharGrafico(main, ctx, { fluxos, curvas }) {
  const { estado, hoje, carteira } = ctx;
  const meses = mesesEntre(fluxos[0].data, hoje);
  const evo = evolucaoComparada(fluxos, curvas, meses, fimDoMes, hoje);
  const fotos = new Map();
  for (const f of estado.fotografias) fotos.set(f.data.slice(0, 7), f.patrimonio);
  const valorCarteira = meses.map((m, i) => (i === meses.length - 1 ? carteira.resumo.patrimonio : fotos.get(m) ?? null));

  const series = [{ rotulo: 'Sua carteira', valores: valorCarteira, cor: corSerie(COR.carteira), espessa: true }];
  for (const k of ['cdi', 'ibov', 'ipca']) {
    if (evo.some((e) => e[k] != null)) series.push({ rotulo: `Se fosse ${REFERENCIAS[k].nome}`, valores: evo.map((e) => e[k]), cor: corSerie(COR[k]) });
  }
  linhas(main.querySelector('#g-comparar'), meses.map(mesCurto), series);
  if (valorCarteira.filter((v) => v != null).length < 3) {
    main.querySelector('#nota-comparar').textContent =
      'A linha da sua carteira vai se formando com o tempo (o valor do dia é guardado sempre que as cotações são atualizadas). As alternativas já mostram o histórico completo.';
  }
}
