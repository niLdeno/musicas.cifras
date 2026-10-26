// ============================================================================
//  Imposto de Renda: apuração mensal (DARF), prejuízos a compensar e a ficha
//  de Bens e Direitos para a declaração anual.
// ============================================================================
import { brl, qtd } from '../core/money.js';
import { CLASSES } from '../core/classes.js';
import { processarLancamentos } from '../core/portfolio.js';
import { apurarIR, bensEDireitos, REGRAS_IR } from '../core/tax.js';
import { esc, info, oc, delta, dataBR, mesLongo, mesCurto } from '../ui/dom.js';

let anoSel = null;

export function renderIR(main, ctx) {
  const { carteira, estado, hoje } = ctx;
  const meses = apurarIR(carteira.vendas);
  const anos = [...new Set([...estado.lancamentos.map((l) => l.data.slice(0, 4)), hoje.slice(0, 4)])].sort().reverse();
  anoSel = anos.includes(anoSel) ? anoSel : anos[0];
  const doAno = meses.filter((m) => m.mes.startsWith(anoSel));
  const ultimo = meses[meses.length - 1];
  const tot = doAno.reduce((t, m) => ({
    isento: t.isento + m.lucroIsento, darf: t.darf + (m.pagar ? m.darf : 0),
  }), { isento: 0, darf: 0 });
  const bens = bensEDireitos(processarLancamentos(estado.lancamentos, `${anoSel}-12-31`).ativos);

  main.innerHTML = `
    <div class="alerta info"><b>Ferramenta de apoio.</b> Os cálculos seguem as regras gerais da Receita Federal para operações comuns de pessoa física.
      Confira sempre com os informes da corretora e, se tiver dúvida, com um contador. Day trade não é calculado aqui.</div>

    <div class="barra-filtros">
      <label>Ano <select data-ano>${anos.map((a) => `<option ${a === anoSel ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
    </div>

    <section class="kpis">
      <div class="kpi cartao"><span class="rotulo">DARFs no ano ${info('darf')}</span><strong class="kpi-valor">${oc(brl(tot.darf))}</strong><small>código ${REGRAS_IR.codigoDarf}</small></div>
      <div class="kpi cartao"><span class="rotulo">Lucro isento (ações) ${info('isencao20k')}</span><strong class="kpi-valor">${oc(brl(tot.isento))}</strong><small>meses com vendas ≤ R$ 20 mil</small></div>
      <div class="kpi cartao"><span class="rotulo">Prejuízo a compensar ${info('prejuizoCompensar')}</span><strong class="kpi-valor">${oc(brl(ultimo?.prejuizoComumAcumulado || 0))}</strong><small>ações, ETFs e BDRs</small></div>
      <div class="kpi cartao"><span class="rotulo">Prejuízo a compensar (FII)</span><strong class="kpi-valor">${oc(brl(ultimo?.prejuizoFiiAcumulado || 0))}</strong><small>só abate lucro de FII</small></div>
    </section>

    <section class="cartao">
      <header class="cartao-cab"><h2>Apuração mensal de ${anoSel}</h2></header>
      ${doAno.length ? `<div class="tabela-rolagem"><table class="tabela compacta tabela-ir">
        <thead><tr><th>Mês</th><th class="num">Vendas de ações</th><th class="num">Resultado ações</th><th class="num">ETF / BDR</th><th class="num">FII</th>
        <th class="num">Prejuízo usado</th><th class="num">Imposto</th><th>DARF</th></tr></thead>
        <tbody>${doAno.map(linhaMes).join('')}</tbody></table></div>
        <p class="dica">Como ler: se o total vendido em <b>ações</b> no mês ficou até R$ 20 mil, o lucro delas é isento.
        ETFs e BDRs pagam 15% e FIIs pagam 20% sempre. Prejuízos ficam guardados para abater lucros futuros. ${info('prejuizoCompensar')}</p>`
        : '<p class="vazio-mini">Nenhuma venda neste ano — sem imposto sobre ganho de capital a apurar.</p>'}
    </section>

    <section class="cartao">
      <header class="cartao-cab"><h2>Bens e Direitos em 31/12/${anoSel}</h2>${info('bensDireitos')}</header>
      ${bens.length ? `<div class="tabela-rolagem"><table class="tabela compacta">
        <thead><tr><th>Ativo</th><th>Grupo / código sugerido</th><th class="num">Quantidade</th><th class="num">Situação em 31/12 (custo)</th><th>Discriminação sugerida</th></tr></thead>
        <tbody>${bens.map((b) => `<tr><td><b>${esc(b.ticker)}</b></td><td>${grupoBem(b.classe)}</td><td class="num">${qtd(b.quantidade)}</td><td class="num">${oc(brl(b.custo))}</td>
          <td><small>${qtd(b.quantidade)} ${esc(CLASSES[b.classe].singular === 'Ação' ? 'ações' : 'cotas')} de ${esc(b.ticker)}, preço médio de ${oc(brl(b.custo / b.quantidade))}, custodiadas na corretora XXX (CNPJ …).</small></td></tr>`).join('')}</tbody>
      </table></div>
      <p class="dica">Informe o <b>custo de aquisição</b> (não o valor de mercado). Dividendos e rendimentos de FII vão em "Rendimentos Isentos"; JCP em "Tributação Exclusiva".</p>`
      : '<p class="vazio-mini">Nenhuma posição em 31/12 deste ano.</p>'}
    </section>`;

  main.querySelector('[data-ano]').addEventListener('change', (e) => { anoSel = e.target.value; renderIR(main, ctx); });
}

function linhaMes(m) {
  const imposto = m.impostoComum + m.impostoFii;
  const darf = m.pagar
    ? `<span class="selo pagar">Pagar ${oc(brl(m.darf))}</span><small class="bloco">vence ${dataBR(m.vencimento)}</small>`
    : m.darf > 0 ? `<small>${oc(brl(m.darf))} acumula (mín. R$ 10)</small>` : '<small>—</small>';
  return `<tr>
    <th scope="row" title="${mesLongo(m.mes)}">${mesCurto(m.mes)}${m.dayTrades ? ' <span class="selo" title="Há operações de day trade não calculadas">DT</span>' : ''}</th>
    <td class="num">${oc(brl(m.vendasAcoes))}<small class="bloco">${m.vendasAcoes ? (m.isento ? '✓ isento' : 'acima de 20 mil') : ''}</small></td>
    <td class="num">${m.resultadoAcoes ? delta(m.resultadoAcoes) : '—'}</td>
    <td class="num">${m.resultadoEtfBdr ? delta(m.resultadoEtfBdr) : '—'}</td>
    <td class="num">${m.resultadoFii ? delta(m.resultadoFii) : '—'}</td>
    <td class="num">${m.compensadoComum + m.compensadoFii ? oc(brl(m.compensadoComum + m.compensadoFii)) : '—'}</td>
    <td class="num">${imposto ? oc(brl(imposto)) : '—'}</td>
    <td>${darf}</td>
  </tr>`;
}

function grupoBem(classe) {
  return {
    acao: 'Grupo 03 – Participações societárias / 01 – Ações',
    fii: 'Grupo 07 – Fundos / 03 – Fundos Imobiliários',
    etf: 'Grupo 07 – Fundos (ETF — confira o código no programa)',
    bdr: 'Grupo 04 – Aplicações (BDR — confira o código no programa)',
  }[classe] + '';
}
