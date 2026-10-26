// ============================================================================
//  Aprenda: glossário completo, agrupado por tema, com busca.
// ============================================================================
import { GLOSSARIO } from '../core/glossario.js';
import { CLASSES, ORDEM_CLASSES } from '../core/classes.js';
import { esc } from '../ui/dom.js';

export function renderAprender(main) {
  const secoes = {};
  for (const [k, g] of Object.entries(GLOSSARIO)) (secoes[g.secao] ||= []).push([k, g]);

  main.innerHTML = `
    <section class="cartao">
      <h2>Como ler a sua carteira em 3 perguntas</h2>
      <ol class="passos">
        <li><b>Quanto eu tenho?</b> → o <b>patrimônio</b>: quanto tudo vale hoje na bolsa.</li>
        <li><b>Estou ganhando ou perdendo?</b> → compare o patrimônio com o <b>valor aplicado</b>. A diferença é o <b>resultado em aberto</b>.
          Ele só vira lucro (ou prejuízo) de verdade quando você vende.</li>
        <li><b>Quanto já rendeu, no total?</b> → o <b>resultado total</b> soma o que está em aberto, o que você já realizou em vendas e os proventos recebidos.</li>
      </ol>
      <p class="dica">Bolsa oscila todos os dias. Para quem investe a longo prazo, olhar o resultado total e a diversificação importa mais do que a variação do dia.</p>
    </section>

    <section class="cartao">
      <h2>Tipos de ativos</h2>
      <dl class="glossario">${ORDEM_CLASSES.map((c) => `<div><dt>${CLASSES[c].nome}</dt><dd>${esc(CLASSES[c].explica)}</dd></div>`).join('')}</dl>
    </section>

    <input type="search" class="busca larga" placeholder="Buscar um termo (ex.: preço médio, DARF)…" aria-label="Buscar termo" />
    <div id="secoes">${Object.entries(secoes).map(([s, itens]) => `
      <section class="cartao secao-glossario">
        <h2>${esc(s)}</h2>
        <dl class="glossario">${itens.map(([k, g]) => `
          <div id="termo-${k}" data-busca="${esc((g.titulo + ' ' + g.texto).toLowerCase())}">
            <dt>${esc(g.titulo)}</dt><dd>${esc(g.texto)}${g.exemplo ? `<span class="exemplo"><b>Exemplo:</b> ${esc(g.exemplo)}</span>` : ''}</dd>
          </div>`).join('')}</dl>
      </section>`).join('')}</div>`;

  main.querySelector('.busca').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    main.querySelectorAll('[data-busca]').forEach((d) => { d.hidden = q && !d.dataset.busca.includes(q); });
    main.querySelectorAll('.secao-glossario').forEach((s) => { s.hidden = ![...s.querySelectorAll('[data-busca]')].some((d) => !d.hidden); });
  });
}
