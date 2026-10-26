// ============================================================================
//  Proventos: quanto a carteira já pagou de dividendos, JCP e rendimentos,
//  mês a mês, e quais ativos mais contribuíram.
// ============================================================================
import { brl, pct } from '../core/money.js';
import { TIPOS_PROVENTO, mesesEntre, deslocarMeses } from '../core/portfolio.js';
import { store } from '../data/store.js';
import { esc, info, oc, dataBR, mesCurto, confirmar, toast } from '../ui/dom.js';
import { barrasEmpilhadas, corSerie } from '../ui/graficos.js';
import { formProvento } from './formularios.js';

let periodo = 12;

export function renderProventos(main, ctx) {
  const { estado, carteira, hoje } = ctx;
  const provs = [...estado.proventos].sort((a, b) => b.data.localeCompare(a.data));
  if (!provs.length) {
    main.innerHTML = `<div class="cartao vazio"><h2>Nenhum provento registrado</h2>
      <p>Dividendos, JCP e rendimentos de FIIs são parte importante do seu ganho. Registre-os para ver quanto a carteira já gerou de "renda". ${info('proventos')}</p>
      <button type="button" class="btn primario" data-novo-prov>Registrar provento</button></div>`;
    main.querySelector('[data-novo-prov]').addEventListener('click', () => formProvento(ctx));
    return;
  }

  const total = provs.reduce((s, p) => s + p.valor, 0);
  const r = carteira.resumo;
  const anoAtual = hoje.slice(0, 4);
  const noAno = provs.filter((p) => p.data.startsWith(anoAtual)).reduce((s, p) => s + p.valor, 0);
  const porAtivo = [...carteira.posicoes].filter((p) => p.proventos > 0).sort((a, b) => b.proventos - a.proventos);

  main.innerHTML = `
    <section class="kpis">
      <div class="kpi cartao"><span class="rotulo">Total recebido ${info('proventos')}</span><strong class="kpi-valor">${oc(brl(total))}</strong><small>desde o início</small></div>
      <div class="kpi cartao"><span class="rotulo">Últimos 12 meses</span><strong class="kpi-valor">${oc(brl(r.proventos12m))}</strong><small>média de ${oc(brl(r.proventos12m / 12))}/mês</small></div>
      <div class="kpi cartao"><span class="rotulo">Em ${anoAtual}</span><strong class="kpi-valor">${oc(brl(noAno))}</strong><small>no ano corrente</small></div>
      <div class="kpi cartao"><span class="rotulo">Yield on Cost ${info('yieldOnCost')}</span><strong class="kpi-valor">${pct(r.yieldOnCost)}</strong><small>ao ano, sobre o valor aplicado</small></div>
    </section>

    <section class="cartao">
      <header class="cartao-cab"><h2>Proventos por mês</h2>
        <div class="alternador" role="group" aria-label="Período">
          ${[12, 24, 0].map((n) => `<button type="button" data-periodo="${n}" class="${periodo === n ? 'ativo' : ''}" aria-pressed="${periodo === n}">${n ? n + 'm' : 'Tudo'}</button>`).join('')}
        </div>
      </header>
      <div class="grafico alto"><canvas id="g-proventos" role="img" aria-label="Proventos recebidos por mês, por tipo"></canvas></div>
    </section>

    <section class="grade-2">
      <article class="cartao">
        <header class="cartao-cab"><h2>Quem mais pagou</h2></header>
        <ul class="ranking">${porAtivo.slice(0, 10).map((p) => `
          <li><a href="#/ativo/${encodeURIComponent(p.ticker)}"><b>${esc(p.ticker)}</b></a>
            <span class="barra-peso larga"><span style="width:${(p.proventos / porAtivo[0].proventos * 100).toFixed(1)}%"></span></span>
            <span class="num">${oc(brl(p.proventos))}${p.yieldOnCost ? `<small class="bloco">YoC ${pct(p.yieldOnCost)}</small>` : ''}</span></li>`).join('')}
        </ul>
      </article>
      <article class="cartao">
        <header class="cartao-cab"><h2>Lançamentos</h2><button type="button" class="btn" data-novo-prov>+ Provento</button></header>
        <div class="tabela-rolagem limitada"><table class="tabela compacta">
          <thead><tr><th>Data</th><th>Ativo</th><th>Tipo</th><th class="num">Valor</th><th><span class="sr">Ações</span></th></tr></thead>
          <tbody>${provs.map((p) => `<tr><td>${dataBR(p.data)}</td><td><b>${esc(p.ticker)}</b></td><td>${TIPOS_PROVENTO[p.tipo]?.nome}</td>
            <td class="num">${oc(brl(p.valor))}</td>
            <td class="acoes-linha"><button type="button" class="btn-texto" data-editar="${esc(p.id)}">Editar</button>
            <button type="button" class="btn-texto perigo" data-excluir="${esc(p.id)}">Excluir</button></td></tr>`).join('')}</tbody>
        </table></div>
      </article>
    </section>`;

  const desenhar = () => {
    const inicio = periodo ? deslocarMeses(hoje, -(periodo - 1)) : provs[provs.length - 1].data;
    const meses = mesesEntre(inicio, hoje);
    const tipos = Object.keys(TIPOS_PROVENTO);
    const series = tipos.map((t, i) => ({
      rotulo: TIPOS_PROVENTO[t].nome,
      cor: corSerie(i + 1),
      valores: meses.map((m) => estado.proventos.filter((p) => p.tipo === t && p.data.startsWith(m)).reduce((s, p) => s + p.valor, 0)),
    })).filter((s) => s.valores.some((v) => v > 0));
    barrasEmpilhadas(main.querySelector('#g-proventos'), meses.map(mesCurto), series);
  };
  desenhar();

  main.addEventListener('click', async (e) => {
    const per = e.target.closest('[data-periodo]');
    if (per) {
      periodo = +per.dataset.periodo;
      main.querySelectorAll('[data-periodo]').forEach((b) => { b.classList.toggle('ativo', b === per); b.setAttribute('aria-pressed', String(b === per)); });
      desenhar();
    }
    if (e.target.closest('[data-novo-prov]')) formProvento(ctx);
    const ed = e.target.closest('[data-editar]');
    if (ed) formProvento(ctx, { existente: estado.proventos.find((p) => p.id === ed.dataset.editar) });
    const ex = e.target.closest('[data-excluir]');
    if (ex) {
      const p = estado.proventos.find((x) => x.id === ex.dataset.excluir);
      if (await confirmar('Excluir provento?', `${esc(p.ticker)} · ${dataBR(p.data)} · ${brl(p.valor)}`, 'Excluir')) {
        store.excluirProvento(p.id);
        toast('Provento excluído.');
      }
    }
  });
}
