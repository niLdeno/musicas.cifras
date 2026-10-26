// ============================================================================
//  Painel: visão geral da carteira, com resumo em linguagem simples.
// ============================================================================
import { brl, pct, pctSinal, brlSinal, sinal } from '../core/money.js';
import { CLASSES, ORDEM_CLASSES } from '../core/classes.js';
import { evolucaoMensal } from '../core/portfolio.js';
import { apurarIR } from '../core/tax.js';
import { esc, info, oc, delta, deltaPct, mesCurto, mesLongo, dataBR } from '../ui/dom.js';
import { rosca, barrasResultado, linhas, corSerie, COR_CLASSE } from '../ui/graficos.js';

export function renderPainel(main, ctx) {
  const { carteira, estado } = ctx;
  if (!estado.lancamentos.length) { main.innerHTML = boasVindas(); return; }
  const r = carteira.resumo;
  const abertas = carteira.posicoes.filter((p) => p.aberta);

  main.innerHTML = `
    ${alertas(ctx)}
    <section class="heroi cartao">
      <div class="heroi-principal">
        <span class="rotulo">Patrimônio hoje ${info('patrimonio')}</span>
        <strong class="numero-heroi">${oc(brl(r.patrimonio))}</strong>
        <span class="heroi-sub">${r.variacaoDiaValor ? `${delta(r.variacaoDiaValor, { pct: r.variacaoDia })} hoje ${info('variacaoDia')}` : '&nbsp;'}</span>
      </div>
      <div class="heroi-frase">${fraseResumo(r)}</div>
    </section>

    <section class="kpis" aria-label="Indicadores">
      ${kpi('Valor aplicado', oc(brl(r.custo)), `em ${r.ativosAbertos} ativo${r.ativosAbertos === 1 ? '' : 's'}`, 'valorAplicado')}
      ${kpi('Resultado em aberto', delta(r.resultadoAberto), deltaPct(r.rentabilidadeAberta) + ' sobre o aplicado', 'resultadoAberto')}
      ${kpi('Lucro realizado', delta(r.lucroRealizado), 'em vendas já feitas', 'lucroRealizado')}
      ${kpi('Proventos (12 meses)', oc(brl(r.proventos12m)), `${pct(r.yieldOnCost)} ao ano sobre o aplicado`, 'yieldOnCost')}
      ${kpi('Resultado total', delta(r.resultadoTotal), deltaPct(r.retornoTotal) + ' sobre tudo que investiu', 'resultadoTotal', true)}
    </section>

    <section class="grade-2">
      <article class="cartao">
        <header class="cartao-cab"><h2>Evolução do patrimônio</h2>${info('patrimonio')}</header>
        <p class="legenda-grafico">Quanto a carteira valia (azul) comparado com quanto você tinha aplicado (laranja). A distância entre as linhas é o seu lucro ou prejuízo.</p>
        <div class="grafico alto"><canvas id="g-evolucao" role="img" aria-label="Gráfico de evolução do patrimônio e do valor aplicado"></canvas></div>
        <p class="nota-grafico" id="nota-evolucao"></p>
      </article>

      <article class="cartao">
        <header class="cartao-cab"><h2>Onde está o seu dinheiro</h2>${info('diversificacao')}</header>
        <div class="alocacao">
          <div class="grafico rosca"><canvas id="g-alocacao" role="img" aria-label="Gráfico de alocação por classe de ativo"></canvas>
            <div class="rosca-centro"><small>${abertas.length} ativos</small><strong>${carteira.porClasse.length} classes</strong></div>
          </div>
          ${legendaAlocacao(ctx)}
        </div>
      </article>
    </section>

    <section class="grade-2">
      <article class="cartao">
        <header class="cartao-cab">
          <h2>Quem está dando lucro ou prejuízo</h2>${info('resultadoAberto')}
          <div class="alternador" role="group" aria-label="Unidade">
            <button type="button" class="ativo" data-modo="brl" aria-pressed="true">R$</button>
            <button type="button" data-modo="pct" aria-pressed="false">%</button>
          </div>
        </header>
        <p class="legenda-grafico">Resultado em aberto de cada ativo: <span class="delta ganho">▲ verde = lucro</span>, <span class="delta perda">▼ vermelho = prejuízo</span> (se vendesse hoje).</p>
        <div class="grafico" style="height:${Math.max(180, abertas.length * 30 + 40)}px"><canvas id="g-resultado" role="img" aria-label="Lucro ou prejuízo por ativo"></canvas></div>
      </article>

      <article class="cartao">
        <header class="cartao-cab"><h2>Destaques</h2>${info('rentabilidade')}</header>
        ${destaques(abertas)}
      </article>
    </section>`;

  desenharEvolucao(ctx);
  desenharAlocacao(ctx);
  const itensRes = [...abertas].sort((a, b) => b.resultadoAberto - a.resultadoAberto)
    .map((p) => ({ rotulo: p.ticker, valor: p.resultadoAberto, pct: p.rentabilidadeAberta }));
  const gr = main.querySelector('#g-resultado');
  barrasResultado(gr, itensRes);
  main.querySelector('.alternador').addEventListener('click', (e) => {
    const b = e.target.closest('[data-modo]');
    if (!b) return;
    main.querySelectorAll('.alternador button').forEach((x) => { x.classList.toggle('ativo', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    const modo = b.dataset.modo;
    const itens = [...itensRes].sort((a, c) => (modo === 'pct' ? c.pct - a.pct : c.valor - a.valor));
    barrasResultado(gr, itens, { modo });
  });
}

function kpi(rotulo, valor, sub, chave, destaque = false) {
  return `<div class="kpi cartao ${destaque ? 'destaque' : ''}">
    <span class="rotulo">${rotulo} ${info(chave)}</span>
    <strong class="kpi-valor">${valor}</strong>
    <small>${sub}</small>
  </div>`;
}

function fraseResumo(r) {
  const s = sinal(r.resultadoAberto);
  const estado = s > 0 ? `<b class="delta ganho">lucro de ${oc(brlSinal(r.resultadoAberto).slice(1))}</b>`
    : s < 0 ? `<b class="delta perda">prejuízo de ${oc(brlSinal(r.resultadoAberto).slice(1))}</b>` : 'resultado zerado';
  const prov = r.proventos > 0 ? ` Além disso, você já recebeu <b>${oc(brl(r.proventos))}</b> em proventos.` : '';
  const placar = r.ativosAbertos ? ` <b>${r.ganhando}</b> de ${r.ativosAbertos} ativos estão no positivo${r.perdendo ? ` e <b>${r.perdendo}</b> no negativo` : ''}.` : '';
  return `<p><span class="icone-frase" aria-hidden="true">💬</span> Em resumo: você aplicou <b>${oc(brl(r.custo))}</b> nos ativos que tem hoje e eles valem <b>${oc(brl(r.patrimonio))}</b>. Se vendesse tudo agora, teria um ${estado} (${pctSinal(r.rentabilidadeAberta)}).${prov}${placar}</p>`;
}

function alertas(ctx) {
  const { carteira, hoje } = ctx;
  const out = [];
  if (carteira.avisos.length) {
    out.push(`<div class="alerta erro" role="alert"><b>⚠ ${carteira.avisos.length} inconsistência(s) nos lançamentos.</b> ${esc(carteira.avisos[0].msg)} <a href="#/lancamentos">Revisar</a></div>`);
  }
  const ir = apurarIR(carteira.vendas);
  const mesPassado = (() => { const [a, m] = hoje.split('-').map(Number); return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`; })();
  const devido = ir.find((x) => x.pagar && (x.mes === mesPassado) && x.vencimento >= hoje);
  if (devido) {
    out.push(`<div class="alerta aviso"><b>🧾 DARF a pagar:</b> ${oc(brl(devido.darf))} referente a ${mesLongo(devido.mes)}, vence em ${dataBR(devido.vencimento)}. <a href="#/ir">Ver detalhes</a></div>`);
  }
  const sem = carteira.posicoes.filter((p) => p.aberta && !p.temCotacao);
  if (sem.length && !ctx.estado.config.demo) {
    out.push(`<div class="alerta info"><b>ℹ Sem cotação:</b> ${sem.map((p) => esc(p.ticker)).join(', ')}. Por enquanto, usamos o preço médio (resultado zero). Clique em ↻ para atualizar, cadastre um token em <a href="#/config">Configurações</a> ou informe o preço manualmente na página do ativo.</div>`);
  }
  return out.join('');
}

function legendaAlocacao(ctx) {
  const { carteira, estado } = ctx;
  const metas = estado.config.metas || {};
  const temMetas = Object.values(metas).some((v) => v > 0);
  const linhasHtml = ORDEM_CLASSES.map((c) => {
    const g = carteira.porClasse.find((x) => x.classe === c);
    if (!g && !metas[c]) return '';
    const atual = g?.peso || 0;
    const meta = metas[c] || 0;
    const dif = atual - meta;
    return `<li>
      <span class="marcador" style="background:${corSerie(COR_CLASSE[c])}"></span>
      <span class="leg-nome">${CLASSES[c].nome}</span>
      <span class="leg-valor">${pct(atual)}<small>${oc(brl(g?.valorMercado || 0))}</small></span>
      ${temMetas ? `<span class="leg-meta" title="Meta: ${pct(meta)}">meta ${pct(meta)}
        ${Math.abs(dif) >= 0.02 ? `<em class="${dif < 0 ? 'abaixo' : 'acima'}">${dif < 0 ? '↓ abaixo' : '↑ acima'}</em>` : '<em class="ok">✓ ok</em>'}</span>` : ''}
    </li>`;
  }).join('');
  return `<div class="legenda-alocacao">
    <ul>${linhasHtml}</ul>
    ${temMetas ? `<p class="dica">Classes <em class="abaixo">↓ abaixo</em> da meta são boas candidatas para os próximos aportes. ${info('rebalanceamento')}</p>`
      : `<p class="dica">Dica: defina metas de alocação em <a href="#/config">Configurações</a> para saber onde aportar. ${info('rebalanceamento')}</p>`}
  </div>`;
}

function desenharAlocacao(ctx) {
  const itens = ORDEM_CLASSES.map((c) => ctx.carteira.porClasse.find((x) => x.classe === c))
    .filter(Boolean).map((g) => ({ rotulo: CLASSES[g.classe].nome, valor: g.valorMercado, cor: corSerie(COR_CLASSE[g.classe]) }));
  rosca(document.getElementById('g-alocacao'), itens);
}

function desenharEvolucao(ctx) {
  const { estado, hoje } = ctx;
  const evo = evolucaoMensal(estado.lancamentos, estado.proventos, hoje);
  const fotosPorMes = new Map();
  for (const f of estado.fotografias) fotosPorMes.set(f.data.slice(0, 7), f); // fica a última de cada mês
  const rotulos = evo.map((e) => mesCurto(e.mes));
  const aplicado = evo.map((e) => e.custo);
  const patrimonio = evo.map((e, i) => {
    if (i === evo.length - 1) return ctx.carteira.resumo.patrimonio;
    return fotosPorMes.get(e.mes)?.patrimonio ?? null;
  });
  const pontos = patrimonio.filter((v) => v != null).length;
  linhas(document.getElementById('g-evolucao'), rotulos, [
    { rotulo: 'Patrimônio', valores: patrimonio, cor: corSerie(1), area: true },
    { rotulo: 'Valor aplicado', valores: aplicado, cor: corSerie(2), degrau: true },
  ]);
  if (pontos < 3) {
    document.getElementById('nota-evolucao').textContent =
      'A linha de patrimônio vai se formando com o tempo: a cada dia em que você abre o app e as cotações são atualizadas, o valor do dia é guardado.';
  }
}

function destaques(abertas) {
  if (!abertas.length) return '<p class="vazio-mini">Nenhum ativo em carteira.</p>';
  const ord = [...abertas].filter((p) => p.temCotacao).sort((a, b) => b.rentabilidadeAberta - a.rentabilidadeAberta);
  const top = ord.slice(0, 3);
  const pior = ord.slice(-3).reverse().filter((p) => !top.includes(p));
  const maior = [...abertas].sort((a, b) => b.peso - a.peso)[0];
  const item = (p) => `<li><a href="#/ativo/${encodeURIComponent(p.ticker)}"><b>${esc(p.ticker)}</b><small>${esc(p.nome || CLASSES[p.classe]?.singular || '')}</small></a>${deltaPct(p.rentabilidadeAberta)}</li>`;
  return `
    <div class="destaques">
      <div><h3>Melhores desempenhos</h3><ul class="lista-destaque">${top.map(item).join('') || '<li>—</li>'}</ul></div>
      <div><h3>Piores desempenhos</h3><ul class="lista-destaque">${pior.map(item).join('') || '<li>—</li>'}</ul></div>
    </div>
    ${maior.peso > 0.25 ? `<p class="alerta info"><b>Concentração:</b> ${esc(maior.ticker)} representa ${pct(maior.peso)} da carteira. Muito peso em um só ativo aumenta o risco. ${info('diversificacao')}</p>` : ''}
    <a class="btn" href="#/carteira">Ver carteira completa →</a>`;
}

function boasVindas() {
  return `
  <section class="boas-vindas cartao">
    <h2>Bem-vindo(a) à sua carteira 👋</h2>
    <p>Aqui você acompanha suas <b>ações, FIIs, ETFs e BDRs</b> e entende, sem complicação, se está ganhando ou perdendo dinheiro — e por quê.</p>
    <ol class="passos">
      <li><b>Registre suas compras</b> (e vendas) com data, quantidade, preço e taxas — estão na nota de corretagem.</li>
      <li><b>O app calcula tudo:</b> preço médio, lucro ou prejuízo de cada ativo, proventos e até o imposto de renda.</li>
      <li><b>Acompanhe:</b> as cotações são atualizadas automaticamente e cada número tem um <span class="ajuda falso">i</span> explicando o que significa.</li>
    </ol>
    <div class="acoes-form esquerda">
      <button type="button" class="btn primario" data-acao="novo">Registrar minha primeira compra</button>
      <button type="button" class="btn" data-acao="demo">Explorar uma carteira de demonstração</button>
    </div>
    <p class="dica">🔒 Seus dados ficam guardados <b>apenas neste navegador</b> — nada é enviado para servidores. Faça backups em Configurações.</p>
  </section>`;
}
