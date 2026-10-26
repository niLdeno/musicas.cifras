// ============================================================================
//  Utilitários de interface: escape de HTML, toast, modal, confirmação e os
//  balões explicativos (ⓘ) ligados ao glossário.
// ============================================================================
import { GLOSSARIO } from '../core/glossario.js';
import { sinal, brlSinal, pctSinal } from '../core/money.js';

const MAPA_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => MAPA_ESC[c]);

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

/** Botão ⓘ que abre a explicação de um termo do glossário. */
export const info = (chave) =>
  GLOSSARIO[chave] ? `<button type="button" class="ajuda" data-info="${chave}" aria-label="O que é ${esc(GLOSSARIO[chave].titulo)}?">i</button>` : '';

/** Valor monetário que some quando "ocultar valores" está ligado. */
export const oc = (texto) => `<span class="oc">${texto}</span>`;

/** Resultado colorido + ícone (cor nunca sozinha: sempre há sinal e seta). */
export function delta(valor, { pct = null, so = 'ambos' } = {}) {
  const s = sinal(valor);
  const cls = s > 0 ? 'ganho' : s < 0 ? 'perda' : 'neutro';
  const seta = s > 0 ? '▲' : s < 0 ? '▼' : '•';
  const partes = [];
  if (so !== 'pct') partes.push(oc(brlSinal(valor)));
  if (pct != null && so !== 'brl') partes.push(so === 'pct' ? pctSinal(pct) : `<small>(${pctSinal(pct)})</small>`);
  return `<span class="delta ${cls}"><span class="seta" aria-hidden="true">${seta}</span> ${partes.join(' ')}</span>`;
}
export function deltaPct(valor) {
  const s = sinal(valor * 1000);
  const cls = s > 0 ? 'ganho' : s < 0 ? 'perda' : 'neutro';
  const seta = s > 0 ? '▲' : s < 0 ? '▼' : '•';
  return `<span class="delta ${cls}"><span class="seta" aria-hidden="true">${seta}</span> ${pctSinal(valor)}</span>`;
}

// ---------------------------------------------------------------------------
export function toast(msg, tipo = 'ok', ms = 3800) {
  const area = $('#toasts');
  const t = document.createElement('div');
  t.className = `toast ${tipo}`;
  t.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  t.innerHTML = esc(msg);
  area.appendChild(t);
  setTimeout(() => { t.classList.add('saindo'); setTimeout(() => t.remove(), 300); }, ms);
}

let modalAberto = null;
/**
 * Abre um modal acessível (foco preso, Esc fecha, foco volta ao gatilho).
 * @returns {{ el: HTMLElement, fechar: Function }}
 */
export function abrirModal({ titulo, corpo, largura = '' , aoFechar }) {
  fecharModal();
  const anterior = document.activeElement;
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `
    <div class="modal ${largura}" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <header class="modal-cab">
        <h2 id="modal-titulo">${titulo}</h2>
        <button type="button" class="btn-icone" data-fechar aria-label="Fechar">✕</button>
      </header>
      <div class="modal-corpo">${corpo}</div>
    </div>`;
  document.body.appendChild(fundo);
  document.body.classList.add('sem-rolagem');
  const modal = fundo.querySelector('.modal');

  const fechar = () => {
    fundo.remove();
    document.body.classList.remove('sem-rolagem');
    document.removeEventListener('keydown', teclas);
    modalAberto = null;
    anterior?.focus?.();
    aoFechar?.();
  };
  const teclas = (e) => {
    if (e.key === 'Escape') fechar();
    if (e.key === 'Tab') {
      const foco = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter((x) => !x.disabled);
      if (!foco.length) return;
      const [pri, ult] = [foco[0], foco[foco.length - 1]];
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    }
  };
  document.addEventListener('keydown', teclas);
  fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(); });
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fechar(); });
  setTimeout(() => ($('input, select, textarea', modal) || $('[data-fechar]', modal))?.focus(), 30);
  modalAberto = { el: modal, fechar };
  return modalAberto;
}
export function fecharModal() { modalAberto?.fechar(); }

export function confirmar(titulo, texto, rotuloOk = 'Confirmar', perigo = true) {
  return new Promise((resolve) => {
    let resposta = false;
    const m = abrirModal({
      titulo: esc(titulo),
      corpo: `<p>${texto}</p>
        <div class="acoes-form">
          <button type="button" class="btn" data-fechar>Cancelar</button>
          <button type="button" class="btn ${perigo ? 'perigo' : 'primario'}" data-ok>${esc(rotuloOk)}</button>
        </div>`,
      aoFechar: () => resolve(resposta),
    });
    m.el.querySelector('[data-ok]').addEventListener('click', () => { resposta = true; m.fechar(); });
  });
}

// ---------------------------------------------------------------------------
//  Balão do glossário (um só, reaproveitado)
// ---------------------------------------------------------------------------
export function instalarBaloes() {
  const balao = document.createElement('div');
  balao.className = 'balao';
  balao.setAttribute('role', 'tooltip');
  balao.hidden = true;
  document.body.appendChild(balao);
  let gatilho = null;

  const fechar = () => { balao.hidden = true; gatilho?.setAttribute('aria-expanded', 'false'); gatilho = null; };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-info]');
    if (!b) { if (!e.target.closest('.balao')) fechar(); return; }
    e.preventDefault();
    e.stopPropagation();
    if (gatilho === b) return fechar();
    const g = GLOSSARIO[b.dataset.info];
    balao.innerHTML = `<strong>${esc(g.titulo)}</strong><p>${esc(g.texto)}</p>${g.exemplo ? `<p class="exemplo"><b>Exemplo:</b> ${esc(g.exemplo)}</p>` : ''}
      <a href="#/aprender" class="mais">Ver todos os conceitos →</a>`;
    balao.hidden = false;
    gatilho = b;
    b.setAttribute('aria-expanded', 'true');
    const r = b.getBoundingClientRect();
    const larg = Math.min(320, window.innerWidth - 32);
    balao.style.width = larg + 'px';
    const left = Math.min(Math.max(16, r.left + r.width / 2 - larg / 2), window.innerWidth - larg - 16);
    balao.style.left = left + window.scrollX + 'px';
    const alto = balao.offsetHeight;
    const cabeEmbaixo = r.bottom + alto + 12 < window.innerHeight;
    balao.style.top = (cabeEmbaixo ? r.bottom + 8 : r.top - alto - 8) + window.scrollY + 'px';
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  window.addEventListener('hashchange', fechar);
  window.addEventListener('resize', fechar);
}

/** Lê os campos de um <form> num objeto simples. */
export const lerForm = (form) => Object.fromEntries(new FormData(form).entries());

export function baixarArquivo(nome, conteudo, tipo = 'application/json') {
  const blob = new Blob([conteudo], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export const dataBR = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const mesCurto = (anoMes) => `${MESES[+anoMes.slice(5, 7) - 1]}/${anoMes.slice(2, 4)}`;
export const mesLongo = (anoMes) => `${MESES_LONGOS[+anoMes.slice(5, 7) - 1]} de ${anoMes.slice(0, 4)}`;
export const hojeISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function tempoRelativo(iso) {
  if (!iso) return 'nunca';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `em ${dataBR(new Date(iso).toISOString())}`;
}
