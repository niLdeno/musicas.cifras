// ============================================================================
//  Carteira: tabela de posições (vira cartões no celular), com filtro por
//  classe, busca e ordenação por qualquer coluna.
// ============================================================================
import { brl, pct, qtd } from '../core/money.js';
import { CLASSES, ORDEM_CLASSES } from '../core/classes.js';
import { esc, info, oc, delta, deltaPct } from '../ui/dom.js';
import { corSerie, COR_CLASSE } from '../ui/graficos.js';

const filtro = { classe: 'todas', busca: '', encerradas: false, ordem: 'valorMercado', desc: true };

const COLUNAS = [
  ['ticker', 'Ativo', null],
  ['quantidade', 'Qtd.', null],
  ['precoMedio', 'Preço médio', 'precoMedio'],
  ['precoAtual', 'Cotação', 'variacaoDia'],
  ['valorMercado', 'Valor atual', 'patrimonio'],
  ['resultadoAberto', 'Lucro / prejuízo', 'resultadoAberto'],
  ['proventos', 'Proventos', 'proventos'],
  ['resultadoTotal', 'Resultado total', 'resultadoTotal'],
  ['peso', 'Peso', 'peso'],
];

export function renderCarteira(main, ctx) {
  const { carteira } = ctx;
  if (!carteira.posicoes.length) {
    main.innerHTML = `<div class="cartao vazio"><h2>Sua carteira está vazia</h2><p>Registre sua primeira compra para começar.</p>
      <button class="btn primario" type="button" data-acao="novo">Registrar compra</button></div>`;
    return;
  }
  const classesPresentes = ORDEM_CLASSES.filter((c) => carteira.posicoes.some((p) => p.classe === c));
  const encerradas = carteira.posicoes.filter((p) => !p.aberta).length;

  main.innerHTML = `
    <div class="barra-filtros">
      <div class="chips" role="group" aria-label="Filtrar por classe">
        <button type="button" class="chip" data-classe="todas">Todas</button>
        ${classesPresentes.map((c) => `<button type="button" class="chip" data-classe="${c}"><span class="marcador" style="background:${corSerie(COR_CLASSE[c])}"></span>${CLASSES[c].nome}</button>`).join('')}
      </div>
      <input type="search" class="busca" placeholder="Buscar ativo…" aria-label="Buscar ativo" value="${esc(filtro.busca)}" />
      ${encerradas ? `<label class="interruptor"><input type="checkbox" ${filtro.encerradas ? 'checked' : ''} data-encerradas /> Mostrar ${encerradas} encerrada(s)</label>` : ''}
    </div>
    <div class="cartao tabela-cartao"><div id="tabela"></div></div>
    <p class="dica">Toque em um ativo para ver o histórico completo, os proventos e informar a cotação manualmente. Clique nos títulos das colunas para ordenar.</p>`;

  const desenhar = () => {
    main.querySelectorAll('[data-classe]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.classe === filtro.classe)));
    main.querySelector('#tabela').innerHTML = tabela(carteira);
  };
  desenhar();

  main.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-classe]');
    if (chip) { filtro.classe = chip.dataset.classe; desenhar(); return; }
    const th = e.target.closest('[data-ordem]');
    if (th) {
      const k = th.dataset.ordem;
      filtro.desc = filtro.ordem === k ? !filtro.desc : k !== 'ticker';
      filtro.ordem = k;
      desenhar();
      return;
    }
    const linha = e.target.closest('[data-ticker]');
    if (linha && !e.target.closest('a,button')) location.hash = '#/ativo/' + encodeURIComponent(linha.dataset.ticker);
  });
  main.addEventListener('keydown', (e) => {
    const linha = e.target.closest('tr[data-ticker]');
    if (linha && e.key === 'Enter' && e.target === linha) location.hash = '#/ativo/' + encodeURIComponent(linha.dataset.ticker);
  });
  main.querySelector('.busca').addEventListener('input', (e) => { filtro.busca = e.target.value; desenhar(); });
  main.querySelector('[data-encerradas]')?.addEventListener('change', (e) => { filtro.encerradas = e.target.checked; desenhar(); });
}

function tabela(carteira) {
  const busca = filtro.busca.trim().toUpperCase();
  const lista = carteira.posicoes
    .filter((p) => filtro.encerradas || p.aberta)
    .filter((p) => filtro.classe === 'todas' || p.classe === filtro.classe)
    .filter((p) => !busca || p.ticker.includes(busca) || (p.nome || '').toUpperCase().includes(busca))
    .sort((a, b) => {
      const va = a[filtro.ordem];
      const vb = b[filtro.ordem];
      const c = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return filtro.desc ? -c : c;
    });
  if (!lista.length) return '<p class="vazio-mini">Nenhum ativo encontrado com esses filtros.</p>';

  const tot = lista.reduce((t, p) => ({
    custo: t.custo + p.custo, valor: t.valor + p.valorMercado, res: t.res + p.resultadoAberto,
    prov: t.prov + p.proventos, total: t.total + p.resultadoTotal, peso: t.peso + p.peso,
  }), { custo: 0, valor: 0, res: 0, prov: 0, total: 0, peso: 0 });

  const cab = COLUNAS.map(([k, t, g]) => {
    const ativa = filtro.ordem === k;
    return `<th scope="col" class="${k === 'ticker' ? '' : 'num'}" aria-sort="${ativa ? (filtro.desc ? 'descending' : 'ascending') : 'none'}">
      <button type="button" data-ordem="${k}">${t}${ativa ? (filtro.desc ? ' ↓' : ' ↑') : ''}</button>${g ? info(g) : ''}</th>`;
  }).join('');

  const corpo = lista.map((p) => `
    <tr data-ticker="${esc(p.ticker)}" class="${p.aberta ? '' : 'encerrada'}" tabindex="0">
      <th scope="row" data-rotulo="Ativo">
        <span class="ativo-id"><span class="marcador" style="background:${corSerie(COR_CLASSE[p.classe])}"></span>
        <a href="#/ativo/${encodeURIComponent(p.ticker)}"><b>${esc(p.ticker)}</b></a>
        <small>${esc(p.nome || CLASSES[p.classe]?.singular)}${p.aberta ? '' : ' · encerrada'}</small></span>
      </th>
      <td class="num" data-rotulo="Quantidade">${qtd(p.quantidade)}</td>
      <td class="num" data-rotulo="Preço médio">${oc(brl(p.precoMedio))}</td>
      <td class="num" data-rotulo="Cotação">${p.aberta ? `${brl(p.precoAtual)}${!p.temCotacao ? ' <span class="selo" title="Sem cotação: usando o preço médio">sem cotação</span>' : p.cotacaoManual ? ' <span class="selo" title="Cotação informada manualmente">manual</span>' : ''}
        ${p.variacaoDia != null ? `<small class="bloco">${deltaPct(p.variacaoDia)} hoje</small>` : ''}` : '—'}</td>
      <td class="num" data-rotulo="Valor atual">${oc(brl(p.valorMercado))}<small class="bloco">custo ${oc(brl(p.custo))}</small></td>
      <td class="num" data-rotulo="Lucro / prejuízo">${p.aberta ? `${delta(p.resultadoAberto)}<small class="bloco">${deltaPct(p.rentabilidadeAberta)}</small>` : `<small>realizado</small> ${delta(p.lucroRealizado)}`}</td>
      <td class="num" data-rotulo="Proventos">${oc(brl(p.proventos))}${p.yieldOnCost ? `<small class="bloco">YoC ${pct(p.yieldOnCost)}</small>` : ''}</td>
      <td class="num" data-rotulo="Resultado total">${delta(p.resultadoTotal)}<small class="bloco">${deltaPct(p.retornoTotal)}</small></td>
      <td class="num" data-rotulo="Peso"><span class="barra-peso"><span style="width:${(p.peso * 100).toFixed(1)}%"></span></span>${pct(p.peso)}</td>
    </tr>`).join('');

  return `<table class="tabela tabela-carteira">
    <caption class="sr">Posições da carteira</caption>
    <thead><tr>${cab}</tr></thead>
    <tbody>${corpo}</tbody>
    <tfoot><tr>
      <th scope="row">Total (${lista.length})</th><td></td><td></td><td></td>
      <td class="num" data-rotulo="Valor atual">${oc(brl(tot.valor))}<small class="bloco">custo ${oc(brl(tot.custo))}</small></td>
      <td class="num" data-rotulo="Lucro / prejuízo">${delta(tot.res)}<small class="bloco">${deltaPct(tot.custo ? tot.res / tot.custo : 0)}</small></td>
      <td class="num" data-rotulo="Proventos">${oc(brl(tot.prov))}</td>
      <td class="num" data-rotulo="Resultado total">${delta(tot.total)}</td>
      <td class="num" data-rotulo="Peso">${pct(tot.peso)}</td>
    </tr></tfoot>
  </table>`;
}
