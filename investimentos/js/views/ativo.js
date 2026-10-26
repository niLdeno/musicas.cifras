// ============================================================================
//  Detalhe de um ativo: números com explicação, linha do tempo das operações
//  (mostrando como o preço médio evoluiu), proventos e cotação manual.
// ============================================================================
import { brl, pct, qtd, parseNumero } from '../core/money.js';
import { CLASSES } from '../core/classes.js';
import { ordenarLancamentos, processarLancamentos, TIPOS_LANCAMENTO, TIPOS_PROVENTO } from '../core/portfolio.js';
import { store } from '../data/store.js';
import { esc, info, oc, delta, deltaPct, dataBR, toast, tempoRelativo } from '../ui/dom.js';
import { formLancamento, formProvento } from './formularios.js';

export function renderAtivo(main, ctx, ticker) {
  const p = ctx.carteira.posicoes.find((x) => x.ticker === ticker);
  if (!p) {
    main.innerHTML = `<div class="cartao vazio"><h2>Ativo não encontrado</h2><p>${esc(ticker)} não tem operações registradas.</p><a class="btn" href="#/carteira">← Voltar à carteira</a></div>`;
    return;
  }
  const ops = ordenarLancamentos(ctx.estado.lancamentos.filter((l) => l.ticker === ticker));
  const provs = ctx.estado.proventos.filter((x) => x.ticker === ticker).sort((a, b) => b.data.localeCompare(a.data));

  main.innerHTML = `
    <a class="voltar" href="#/carteira">← Carteira</a>
    <section class="cartao ativo-cab">
      <div>
        <span class="selo-classe">${CLASSES[p.classe]?.singular}</span> ${info(p.classe === 'fii' ? 'rendimento' : 'ticker')}
        <h2>${esc(p.ticker)} <small>${esc(p.nome)}</small></h2>
        <p class="dica">${esc(CLASSES[p.classe]?.explica || '')}</p>
      </div>
      <div class="ativo-preco">
        <span class="rotulo">Cotação ${info('variacaoDia')}</span>
        <strong class="numero-heroi">${p.aberta ? brl(p.precoAtual) : '—'}</strong>
        <span>${p.variacaoDia != null ? deltaPct(p.variacaoDia) + ' hoje · ' : ''}<small>${!p.temCotacao ? 'sem cotação (usando o preço médio)' : `${p.cotacaoManual ? 'informada manualmente' : 'brapi.dev'} · ${tempoRelativo(p.cotacaoAtualizadaEm)}`}</small></span>
        <form class="preco-manual" novalidate>
          <label class="sr" for="pm-in">Informar cotação manualmente</label>
          <input id="pm-in" name="preco" inputmode="decimal" placeholder="Cotação manual (R$)" />
          <button class="btn" type="submit">Salvar</button>
        </form>
      </div>
    </section>

    <section class="cartao explicacao">${explicacao(p)}</section>

    <section class="kpis">
      ${mini('Quantidade', qtd(p.quantidade))}
      ${mini('Preço médio', oc(brl(p.precoMedio)), 'precoMedio')}
      ${mini('Valor aplicado', oc(brl(p.custo)), 'valorAplicado')}
      ${mini('Valor atual', oc(brl(p.valorMercado)), 'patrimonio')}
      ${mini('Resultado em aberto', `${delta(p.resultadoAberto)} ${deltaPct(p.rentabilidadeAberta)}`, 'resultadoAberto')}
      ${mini('Lucro realizado', delta(p.lucroRealizado), 'lucroRealizado')}
      ${mini('Proventos recebidos', `${oc(brl(p.proventos))}${p.yieldOnCost ? ` <small>YoC ${pct(p.yieldOnCost)}</small>` : ''}`, 'proventos')}
      ${mini('Resultado total', `${delta(p.resultadoTotal)} ${deltaPct(p.retornoTotal)}`, 'resultadoTotal')}
      ${mini('Peso na carteira', pct(p.peso), 'peso')}
    </section>

    <div class="acoes-form esquerda">
      <button type="button" class="btn primario" data-novo="compra">Comprar mais</button>
      ${p.aberta ? '<button type="button" class="btn" data-novo="venda">Registrar venda</button>' : ''}
      <button type="button" class="btn" data-novo="provento">Registrar provento</button>
      <button type="button" class="btn" data-novo="desdobramento">Desdobramento / bonificação</button>
    </div>

    <section class="cartao">
      <header class="cartao-cab"><h2>Histórico de operações</h2>${info('precoMedio')}</header>
      <p class="legenda-grafico">Veja como cada operação mexeu na sua quantidade e no preço médio.</p>
      <div class="tabela-rolagem">${linhaDoTempo(ops)}</div>
    </section>

    <section class="cartao">
      <header class="cartao-cab"><h2>Proventos recebidos</h2>${info('proventos')}</header>
      ${provs.length ? `<div class="tabela-rolagem"><table class="tabela compacta"><thead><tr><th>Data</th><th>Tipo</th><th class="num">Valor</th><th></th></tr></thead><tbody>
        ${provs.map((x) => `<tr><td>${dataBR(x.data)}</td><td>${TIPOS_PROVENTO[x.tipo]?.nome}</td><td class="num">${oc(brl(x.valor))}</td>
          <td class="acoes-linha"><button type="button" class="btn-texto" data-editar-prov="${esc(x.id)}">Editar</button></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="vazio-mini">Nenhum provento registrado para este ativo.</p>'}
    </section>`;

  main.addEventListener('click', (e) => {
    const n = e.target.closest('[data-novo]');
    if (n) {
      if (n.dataset.novo === 'provento') formProvento(ctx, { ticker });
      else formLancamento(ctx, { tipo: n.dataset.novo, ticker });
    }
    const ed = e.target.closest('[data-editar-op]');
    if (ed) formLancamento(ctx, { existente: ctx.estado.lancamentos.find((l) => l.id === ed.dataset.editarOp) });
    const ep = e.target.closest('[data-editar-prov]');
    if (ep) formProvento(ctx, { existente: ctx.estado.proventos.find((x) => x.id === ep.dataset.editarProv) });
  });
  main.querySelector('.preco-manual').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseNumero(e.target.preco.value);
    if (!(v > 0)) { toast('Informe um preço válido, ex.: 32,50', 'erro'); return; }
    store.definirCotacaoManual(ticker, v);
    toast(`Cotação de ${ticker} definida em ${brl(v)}.`);
  });
}

const mini = (rotulo, valor, chave) => `<div class="kpi cartao"><span class="rotulo">${rotulo} ${chave ? info(chave) : ''}</span><strong class="kpi-valor menor">${valor}</strong></div>`;

function explicacao(p) {
  if (!p.aberta) {
    return `<p>💬 Você já vendeu toda a sua posição em <b>${esc(p.ticker)}</b>. No total, com vendas e proventos, o resultado foi ${delta(p.resultadoTotal)} (${deltaPct(p.retornoTotal)} sobre ${oc(brl(p.totalComprado))} investidos).</p>`;
  }
  const s = p.resultadoAberto;
  const comp = s > 0.005 ? `está <b class="delta ganho">acima</b> do seu preço médio — por isso você tem lucro` : s < -0.005 ? `está <b class="delta perda">abaixo</b> do seu preço médio — por isso você tem prejuízo (que só se torna real se vender)` : 'está igual ao seu preço médio';
  const prov = p.proventos > 0 ? ` Somando os ${oc(brl(p.proventos))} de proventos${p.lucroRealizado ? ' e as vendas já feitas' : ''}, o resultado total é ${delta(p.resultadoTotal)}.` : '';
  return `<p>💬 Você tem <b>${qtd(p.quantidade)}</b> ${esc(p.ticker)} e pagou, em média, <b>${oc(brl(p.precoMedio))}</b> por unidade. A cotação atual (${brl(p.precoAtual)}) ${comp}: ${delta(s, { pct: p.rentabilidadeAberta })}.${prov}</p>`;
}

function linhaDoTempo(ops) {
  if (!ops.length) return '<p class="vazio-mini">Sem operações.</p>';
  const linhas = ops.map((op, i) => {
    const { ativos, vendas } = processarLancamentos(ops.slice(0, i + 1));
    const a = [...ativos.values()][0];
    const pm = a.quantidade > 0 ? a.custo / a.quantidade : 0;
    const venda = op.tipo === 'venda' ? vendas[vendas.length - 1] : null;
    const detalhe = op.tipo === 'desdobramento' ? `fator ${String(op.fator).replace('.', ',')}`
      : `${qtd(op.quantidade)} × ${oc(brl(op.preco))}${op.taxas ? ` + ${oc(brl(op.taxas))}` : ''}`;
    return `<tr>
      <td>${dataBR(op.data)}</td>
      <td><span class="selo-op ${op.tipo}">${TIPOS_LANCAMENTO[op.tipo]?.nome}</span></td>
      <td>${detalhe}</td>
      <td class="num">${venda ? delta(venda.resultado) : '—'}</td>
      <td class="num">${qtd(a.quantidade)}</td>
      <td class="num">${oc(brl(pm))}</td>
      <td class="acoes-linha"><button type="button" class="btn-texto" data-editar-op="${esc(op.id)}">Editar</button></td>
    </tr>`;
  }).reverse().join('');
  return `<table class="tabela compacta"><thead><tr><th>Data</th><th>Operação</th><th>Detalhe</th><th class="num">Resultado</th><th class="num">Qtd. após</th><th class="num">PM após</th><th></th></tr></thead><tbody>${linhas}</tbody></table>`;
}

