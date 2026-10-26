// ============================================================================
//  Formulários de operação e de provento (modais), reutilizados em várias telas.
// ============================================================================
import { store } from '../data/store.js';
import { CLASSES, ORDEM_CLASSES, sugerirClasse, normalizarTicker, tickerValido } from '../core/classes.js';
import { TIPOS_PROVENTO, processarLancamentos } from '../core/portfolio.js';
import { validarLancamento, validarProvento, lerCSVLancamentos } from '../core/validacao.js';
import { brl, qtd, parseNumero, brlSinal, pctSinal } from '../core/money.js';
import { abrirModal, esc, info, lerForm, toast, hojeISO, $ } from '../ui/dom.js';

const opcoesClasse = (sel) => ORDEM_CLASSES.map((c) =>
  `<option value="${c}" ${c === sel ? 'selected' : ''}>${CLASSES[c].singular}</option>`).join('');

const listaTickers = (ctx) => `<datalist id="lista-tickers">${ctx.carteira.posicoes.map((p) => `<option value="${p.ticker}">`).join('')}</datalist>`;

export function escolherNovaOperacao(ctx) {
  const opc = [
    ['compra', '🟢', 'Compra', 'Comprei ações, FIIs, ETFs ou BDRs'],
    ['venda', '🔴', 'Venda', 'Vendi parte ou toda a posição'],
    ['provento', '💰', 'Provento', 'Recebi dividendos, JCP ou rendimentos'],
    ['evento', '🔀', 'Desdobramento / bonificação', 'A empresa mudou a quantidade de ações'],
    ['csv', '📄', 'Importar planilha (CSV)', 'Várias operações de uma vez'],
  ];
  const m = abrirModal({
    titulo: 'O que você quer registrar?',
    corpo: `<div class="escolhas">${opc.map(([k, ic, t, d]) => `
      <button type="button" class="escolha" data-op="${k}"><span class="escolha-ic" aria-hidden="true">${ic}</span>
        <span><strong>${t}</strong><small>${d}</small></span></button>`).join('')}</div>`,
  });
  m.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    const op = b.dataset.op;
    if (op === 'provento') formProvento(ctx);
    else if (op === 'csv') formImportarCSV(ctx);
    else if (op === 'evento') formLancamento(ctx, { tipo: 'desdobramento' });
    else formLancamento(ctx, { tipo: op });
  });
}

// ---------------------------------------------------------------------------
export function formLancamento(ctx, { tipo = 'compra', ticker = '', existente = null } = {}) {
  const l = existente || { tipo, ticker, data: hojeISO(), classe: ticker ? (ctx.carteira.posicoes.find((p) => p.ticker === ticker)?.classe || sugerirClasse(ticker)) : 'acao' };
  const ehEvento = (t) => t === 'desdobramento' || t === 'bonificacao';
  const titulo = existente ? 'Editar operação' : ehEvento(l.tipo) ? 'Evento corporativo' : l.tipo === 'venda' ? 'Registrar venda' : 'Registrar compra';
  const num = (v) => (v == null || v === '' ? '' : String(v).replace('.', ','));

  const m = abrirModal({
    titulo,
    corpo: `
    <form class="form" novalidate>
      <fieldset class="segmentado" ${ehEvento(l.tipo) ? 'hidden' : ''}>
        <legend class="sr">Tipo</legend>
        <label><input type="radio" name="tipo" value="compra" ${l.tipo === 'compra' ? 'checked' : ''}><span>Compra</span></label>
        <label><input type="radio" name="tipo" value="venda" ${l.tipo === 'venda' ? 'checked' : ''}><span>Venda</span></label>
      </fieldset>
      <fieldset class="segmentado" ${ehEvento(l.tipo) ? '' : 'hidden'}>
        <legend class="sr">Evento</legend>
        <label><input type="radio" name="tipo" value="desdobramento" ${l.tipo === 'desdobramento' ? 'checked' : ''}><span>Desdobr. / grupamento</span></label>
        <label><input type="radio" name="tipo" value="bonificacao" ${l.tipo === 'bonificacao' ? 'checked' : ''}><span>Bonificação</span></label>
      </fieldset>

      <div class="grade-form">
        <label class="campo">Código do ativo ${info('ticker')}
          <input name="ticker" list="lista-tickers" required autocomplete="off" autocapitalize="characters" placeholder="Ex.: PETR4" value="${esc(l.ticker)}" maxlength="7" />
        </label>
        <label class="campo">Classe
          <select name="classe">${opcoesClasse(l.classe)}</select>
        </label>
        <label class="campo">Data
          <input type="date" name="data" required value="${esc(l.data)}" max="${hojeISO()}" />
        </label>
        <label class="campo so-fator">Fator ${info('desdobramento')}
          <input name="fator" inputmode="decimal" placeholder="2 (1→2) ou 0,1 (10→1)" value="${num(l.fator)}" />
        </label>
        <label class="campo so-qtd">Quantidade
          <input name="quantidade" inputmode="decimal" placeholder="100" value="${num(l.quantidade)}" />
        </label>
        <label class="campo so-qtd"><span class="rotulo-preco">Preço por unidade (R$)</span>
          <input name="preco" inputmode="decimal" placeholder="0,00" value="${num(l.preco)}" />
        </label>
        <label class="campo so-taxas">Taxas e corretagem (R$) ${info('taxas')}
          <input name="taxas" inputmode="decimal" placeholder="0,00" value="${num(l.taxas)}" />
        </label>
        <label class="campo largo">Observação (opcional)
          <input name="nota" maxlength="200" value="${esc(l.nota || '')}" placeholder="Ex.: nota de corretagem nº 1234" />
        </label>
      </div>

      <div class="previa" aria-live="polite"></div>
      <ul class="erros" aria-live="assertive"></ul>
      <div class="acoes-form">
        <button type="button" class="btn" data-fechar>Cancelar</button>
        <button type="submit" class="btn primario">${existente ? 'Salvar alterações' : 'Registrar'}</button>
      </div>
      ${listaTickers(ctx)}
    </form>`,
  });

  const form = $('form', m.el);
  let classeTocada = !!existente;
  form.classe.addEventListener('change', () => { classeTocada = true; });

  const atualizar = () => {
    const d = lerForm(form);
    const t = d.tipo;
    form.querySelectorAll('.so-fator').forEach((x) => (x.hidden = t !== 'desdobramento'));
    form.querySelectorAll('.so-qtd').forEach((x) => (x.hidden = t === 'desdobramento'));
    form.querySelectorAll('.so-taxas').forEach((x) => (x.hidden = ehEvento(t)));
    $('.rotulo-preco', form).innerHTML = t === 'bonificacao' ? `Custo atribuído por ação (R$) ${info('bonificacao')}` : 'Preço por unidade (R$)';

    const tk = normalizarTicker(d.ticker);
    if (!classeTocada && tickerValido(tk)) {
      form.classe.value = ctx.carteira.posicoes.find((p) => p.ticker === tk)?.classe || sugerirClasse(tk);
    }
    $('.previa', form).innerHTML = previa(ctx, { ...d, ticker: tk }, existente);
  };
  form.addEventListener('input', atualizar);
  atualizar();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = lerForm(form);
    const r = validarLancamento({ ...d, id: existente?.id, criadoEm: existente?.criadoEm }, hojeISO());
    if (!r.ok) {
      $('.erros', form).innerHTML = r.erros.map((x) => `<li>${esc(x)}</li>`).join('');
      return;
    }
    // Venda acima da posição: avisa antes de salvar
    if (r.valor.tipo === 'venda') {
      const outros = ctx.estado.lancamentos.filter((x) => x.id !== existente?.id);
      const pos = processarLancamentos(outros, r.valor.data).ativos.get(r.valor.ticker);
      if (!pos || r.valor.quantidade > pos.quantidade + 1e-9) {
        $('.erros', form).innerHTML = `<li>Em ${esc(r.valor.data.split('-').reverse().join('/'))} você tinha ${qtd(pos?.quantidade || 0)} ${esc(r.valor.ticker)}. Registre a compra antes (ou corrija a quantidade/data).</li>`;
        return;
      }
    }
    if (!existente) delete r.valor.id;
    store.salvarLancamento(r.valor);
    m.fechar();
    toast(existente ? 'Operação atualizada.' : 'Operação registrada!');
  });
}

function previa(ctx, d, existente) {
  const q = parseNumero(d.quantidade);
  const p = parseNumero(d.preco);
  const tx = parseNumero(d.taxas) || 0;
  if (d.tipo === 'desdobramento') {
    const f = parseNumero(d.fator);
    const pos = ctx.carteira.posicoes.find((x) => x.ticker === d.ticker);
    if (!(f > 0) || !pos?.aberta) return '<p class="dica">Desdobramento: informe 2 se cada ação virou 2. Grupamento: 0,1 se cada 10 viraram 1.</p>';
    return `<p>Hoje você tem <b>${qtd(pos.quantidade)}</b>; passará a ter <b>${qtd(pos.quantidade * f)}</b>. O custo total não muda e o preço médio vai de ${brl(pos.precoMedio)} para <b>${brl(pos.precoMedio / f)}</b>.</p>`;
  }
  if (!(q > 0) || !(p >= 0)) return '';
  const bruto = q * p;
  if (d.tipo === 'compra') {
    return `<p>Total da compra: <b>${brl(bruto + tx)}</b> <small>(${qtd(q)} × ${brl(p)}${tx ? ` + ${brl(tx)} de taxas` : ''})</small> — esse valor entra no seu preço médio.</p>`;
  }
  if (d.tipo === 'bonificacao') return `<p>Você receberá ${qtd(q)} novas unidades, com custo de ${brl(bruto)} somado ao seu preço médio.</p>`;
  // venda: estima o resultado com o PM da data
  const outros = ctx.estado.lancamentos.filter((x) => x.id !== existente?.id);
  const pos = d.data ? processarLancamentos(outros, d.data).ativos.get(d.ticker) : null;
  if (!pos || pos.quantidade <= 0) return `<p class="dica">Total da venda: <b>${brl(bruto - tx)}</b>.</p>`;
  const pm = pos.custo / pos.quantidade;
  const res = bruto - tx - q * pm;
  const cls = res >= 0 ? 'ganho' : 'perda';
  return `<p>Você tinha ${qtd(pos.quantidade)} com preço médio de ${brl(pm)}. Recebe <b>${brl(bruto - tx)}</b>.</p>
    <p>Resultado desta venda: <b class="delta ${cls}">${res >= 0 ? '▲' : '▼'} ${brlSinal(res)} (${pctSinal(res / (q * pm))})</b> ${info('lucroRealizado')}</p>`;
}

// ---------------------------------------------------------------------------
export function formProvento(ctx, { ticker = '', existente = null } = {}) {
  const p = existente || { tipo: ticker && ctx.carteira.posicoes.find((x) => x.ticker === ticker)?.classe === 'fii' ? 'rendimento' : 'dividendo', ticker, data: hojeISO() };
  const m = abrirModal({
    titulo: existente ? 'Editar provento' : 'Registrar provento',
    corpo: `
    <form class="form" novalidate>
      <div class="grade-form">
        <label class="campo">Código do ativo
          <input name="ticker" list="lista-tickers" required autocomplete="off" placeholder="Ex.: ITSA4" value="${esc(p.ticker)}" maxlength="7" />
        </label>
        <label class="campo">Tipo ${info('proventos')}
          <select name="tipo">${Object.entries(TIPOS_PROVENTO).map(([k, t]) => `<option value="${k}" ${k === p.tipo ? 'selected' : ''}>${t.nome}</option>`).join('')}</select>
        </label>
        <label class="campo">Data do pagamento
          <input type="date" name="data" required value="${esc(p.data)}" max="${hojeISO()}" />
        </label>
        <label class="campo">Valor total recebido (R$)
          <input name="valor" inputmode="decimal" required placeholder="0,00" value="${p.valor != null ? String(p.valor).replace('.', ',') : ''}" />
        </label>
        <label class="campo largo">Observação (opcional)
          <input name="nota" maxlength="200" value="${esc(p.nota || '')}" />
        </label>
      </div>
      <p class="dica">Lance o valor que <b>caiu na sua conta</b> (no JCP, já com os 15% de IR descontados). Você encontra no extrato da corretora ou na Área do Investidor da B3.</p>
      <ul class="erros" aria-live="assertive"></ul>
      <div class="acoes-form">
        <button type="button" class="btn" data-fechar>Cancelar</button>
        <button type="submit" class="btn primario">${existente ? 'Salvar' : 'Registrar'}</button>
      </div>
      ${listaTickers(ctx)}
    </form>`,
  });
  const form = $('form', m.el);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = validarProvento({ ...lerForm(form), id: existente?.id, criadoEm: existente?.criadoEm }, hojeISO());
    if (!r.ok) { $('.erros', form).innerHTML = r.erros.map((x) => `<li>${esc(x)}</li>`).join(''); return; }
    if (!existente) delete r.valor.id;
    store.salvarProvento(r.valor);
    m.fechar();
    toast(existente ? 'Provento atualizado.' : 'Provento registrado!');
  });
}

// ---------------------------------------------------------------------------
export function formImportarCSV(ctx) {
  const m = abrirModal({
    titulo: 'Importar operações (CSV)',
    largura: 'largo',
    corpo: `
      <p>Monte uma planilha (Excel, Google Planilhas) com estas colunas e salve como <b>CSV</b>:</p>
      <pre class="codigo">data;tipo;ticker;quantidade;preco;taxas
15/01/2025;compra;PETR4;100;35,50;2,40
20/03/2025;venda;PETR4;50;38,10;1,90</pre>
      <p class="dica">Tipo: <b>compra</b> ou <b>venda</b> (ou C/V). A coluna <b>classe</b> (acao, fii, etf, bdr) é opcional — sem ela, o app sugere pelo código.</p>
      <label class="campo">Arquivo CSV <input type="file" accept=".csv,text/csv" /></label>
      <div class="resultado-import"></div>
      <div class="acoes-form">
        <button type="button" class="btn" data-fechar>Cancelar</button>
        <button type="button" class="btn primario" data-importar disabled>Importar</button>
      </div>`,
  });
  let validos = [];
  $('input[type=file]', m.el).addEventListener('change', async (e) => {
    const arq = e.target.files[0];
    if (!arq) return;
    if (arq.size > 2_000_000) { toast('Arquivo muito grande (máx. 2 MB).', 'erro'); return; }
    const r = lerCSVLancamentos(await arq.text(), sugerirClasse);
    validos = r.validos;
    $('.resultado-import', m.el).innerHTML = `
      <p><b>${validos.length}</b> operação(ões) pronta(s) para importar.</p>
      ${r.erros.length ? `<ul class="erros">${r.erros.slice(0, 10).map((x) => `<li>${esc(x)}</li>`).join('')}${r.erros.length > 10 ? `<li>…e mais ${r.erros.length - 10}</li>` : ''}</ul>` : ''}`;
    $('[data-importar]', m.el).disabled = !validos.length;
  });
  $('[data-importar]', m.el).addEventListener('click', () => {
    store.adicionarLancamentos(validos);
    m.fechar();
    toast(`${validos.length} operações importadas.`);
    const { avisos } = processarLancamentos(store.get().lancamentos);
    if (avisos.length) toast(`Atenção: ${avisos.length} inconsistência(s) — veja a tela de Operações.`, 'aviso', 7000);
  });
}
