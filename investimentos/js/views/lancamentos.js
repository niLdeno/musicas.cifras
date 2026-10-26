// ============================================================================
//  Operações: lista de todas as compras, vendas e eventos, com filtros,
//  edição, exclusão e exportação para CSV.
// ============================================================================
import { brl, qtd } from '../core/money.js';
import { TIPOS_LANCAMENTO, ordenarLancamentos } from '../core/portfolio.js';
import { store } from '../data/store.js';
import { esc, oc, delta, dataBR, confirmar, toast, baixarArquivo, hojeISO } from '../ui/dom.js';
import { formLancamento, formImportarCSV } from './formularios.js';

const filtro = { tipo: 'todos', busca: '', ano: 'todos' };

export function renderLancamentos(main, ctx) {
  const { estado, carteira } = ctx;
  const anos = [...new Set(estado.lancamentos.map((l) => l.data.slice(0, 4)))].sort().reverse();
  const resultadoPorId = new Map(carteira.vendas.map((v) => [v.id, v]));
  const idsComAviso = new Set(carteira.avisos.map((a) => a.id).filter(Boolean));

  main.innerHTML = `
    ${carteira.avisos.length ? `<div class="alerta erro" role="alert"><b>⚠ Inconsistências encontradas:</b><ul>${carteira.avisos.map((a) => `<li>${esc(a.msg)}</li>`).join('')}</ul>
      Normalmente é uma compra que ficou faltando ou uma data trocada.</div>` : ''}
    <div class="barra-filtros">
      <select data-f="tipo" aria-label="Tipo"><option value="todos">Todos os tipos</option>${Object.entries(TIPOS_LANCAMENTO).map(([k, t]) => `<option value="${k}" ${filtro.tipo === k ? 'selected' : ''}>${t.nome}</option>`).join('')}</select>
      <select data-f="ano" aria-label="Ano"><option value="todos">Todos os anos</option>${anos.map((a) => `<option ${filtro.ano === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
      <input type="search" class="busca" data-f="busca" placeholder="Buscar ativo…" aria-label="Buscar ativo" value="${esc(filtro.busca)}" />
      <span class="espaco"></span>
      <button type="button" class="btn" data-csv-importar>Importar CSV</button>
      <button type="button" class="btn" data-csv-exportar ${estado.lancamentos.length ? '' : 'disabled'}>Exportar CSV</button>
    </div>
    <div class="cartao tabela-cartao" id="lista"></div>`;

  const desenhar = () => {
    const b = filtro.busca.trim().toUpperCase();
    const lista = ordenarLancamentos(estado.lancamentos).reverse()
      .filter((l) => filtro.tipo === 'todos' || l.tipo === filtro.tipo)
      .filter((l) => filtro.ano === 'todos' || l.data.startsWith(filtro.ano))
      .filter((l) => !b || l.ticker.includes(b));
    main.querySelector('#lista').innerHTML = !lista.length
      ? `<div class="vazio"><p>${estado.lancamentos.length ? 'Nenhuma operação com esses filtros.' : 'Nenhuma operação registrada ainda.'}</p>
         <button class="btn primario" type="button" data-acao="novo">Registrar operação</button></div>`
      : `<table class="tabela tabela-ops">
        <caption class="sr">Operações registradas</caption>
        <thead><tr><th>Data</th><th>Ativo</th><th>Operação</th><th class="num">Quantidade</th><th class="num">Preço</th><th class="num">Taxas</th><th class="num">Total</th><th class="num">Resultado</th><th><span class="sr">Ações</span></th></tr></thead>
        <tbody>${lista.map((l) => {
          const v = resultadoPorId.get(l.id);
          const total = l.tipo === 'compra' ? l.quantidade * l.preco + (l.taxas || 0) : l.tipo === 'venda' ? l.quantidade * l.preco - (l.taxas || 0) : null;
          return `<tr class="${idsComAviso.has(l.id) ? 'com-aviso' : ''}">
            <td data-rotulo="Data">${dataBR(l.data)}</td>
            <th scope="row" data-rotulo="Ativo"><a href="#/ativo/${encodeURIComponent(l.ticker)}">${esc(l.ticker)}</a></th>
            <td data-rotulo="Operação"><span class="selo-op ${l.tipo}">${TIPOS_LANCAMENTO[l.tipo]?.nome}</span>${l.nota ? `<small class="bloco">${esc(l.nota)}</small>` : ''}</td>
            <td class="num" data-rotulo="Quantidade">${l.tipo === 'desdobramento' ? `fator ${String(l.fator).replace('.', ',')}` : qtd(l.quantidade)}</td>
            <td class="num" data-rotulo="Preço">${l.tipo === 'desdobramento' ? '—' : oc(brl(l.preco))}</td>
            <td class="num" data-rotulo="Taxas">${l.taxas ? oc(brl(l.taxas)) : '—'}</td>
            <td class="num" data-rotulo="Total">${total != null ? oc(brl(total)) : '—'}</td>
            <td class="num" data-rotulo="Resultado">${v ? delta(v.resultado) + (v.dayTrade ? ' <span class="selo" title="Compra e venda no mesmo dia">day trade</span>' : '') : '—'}</td>
            <td class="acoes-linha">
              <button type="button" class="btn-texto" data-editar="${esc(l.id)}">Editar</button>
              <button type="button" class="btn-texto perigo" data-excluir="${esc(l.id)}">Excluir</button>
            </td></tr>`;
        }).join('')}</tbody></table>
        <p class="rodape-tabela">${lista.length} operação(ões)</p>`;
  };
  desenhar();

  main.addEventListener('input', (e) => {
    const f = e.target.dataset.f;
    if (f) { filtro[f] = e.target.value; desenhar(); }
  });
  main.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-editar]');
    if (ed) formLancamento(ctx, { existente: estado.lancamentos.find((l) => l.id === ed.dataset.editar) });
    const ex = e.target.closest('[data-excluir]');
    if (ex) {
      const l = estado.lancamentos.find((x) => x.id === ex.dataset.excluir);
      const ok = await confirmar('Excluir operação?', `${esc(TIPOS_LANCAMENTO[l.tipo].nome)} de ${esc(l.ticker)} em ${dataBR(l.data)}. Isso recalcula o preço médio e os resultados.`, 'Excluir');
      if (ok) { store.excluirLancamento(l.id); toast('Operação excluída.'); }
    }
    if (e.target.closest('[data-csv-importar]')) formImportarCSV(ctx);
    if (e.target.closest('[data-csv-exportar]')) exportarCSV(estado.lancamentos);
  });
}

function exportarCSV(lancamentos) {
  const n = (v) => (v == null ? '' : String(v).replace('.', ','));
  const linhas = ['data;tipo;ticker;classe;quantidade;preco;taxas;fator;nota',
    ...ordenarLancamentos(lancamentos).map((l) => [l.data, l.tipo, l.ticker, l.classe, n(l.quantidade), n(l.preco), n(l.taxas), n(l.fator), (l.nota || '').replace(/[;\n]/g, ' ')].join(';'))];
  baixarArquivo(`operacoes-${hojeISO()}.csv`, '﻿' + linhas.join('\n'), 'text/csv;charset=utf-8');
}
