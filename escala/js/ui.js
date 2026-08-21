// ============================================================================
//  Componentes de UI compartilhados: toast, modal e confirmação.
// ============================================================================
import { el, esc } from './util.js';

export function toast(msg, tipo = '') {
  let box = document.querySelector('.toasts');
  if (!box) {
    box = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(box);
  }
  const icone = tipo === 'ok' ? 'check-circle' : tipo === 'erro' ? 'circle-exclamation' : 'circle-info';
  const t = el('div', { class: `toast ${tipo}`, role: tipo === 'erro' ? 'alert' : 'status',
    html: `<i class="fa-solid fa-${icone}" aria-hidden="true"></i><span>${esc(msg)}</span>` });
  box.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// Abre um modal. `conteudo` é um HTMLElement (o corpo). `acoes` = [{label, classe, onClick, fechar}]
export function abrirModal({ titulo, icone = 'pen', conteudo, acoes = [], largura }) {
  const focoAnterior = document.activeElement;
  const tituloId = 'modal-tit-' + Math.random().toString(36).slice(2, 8);
  const bg = el('div', { class: 'modal-bg' });
  const modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': tituloId });
  if (largura) modal.style.maxWidth = largura;

  const corpo = el('div', { class: 'corpo' });
  corpo.appendChild(conteudo);

  const rodape = el('div', { class: 'rodape' });
  const fechar = () => {
    document.removeEventListener('keydown', aoTeclar);
    bg.classList.remove('aberto');
    setTimeout(() => bg.remove(), 150);
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus(); // devolve o foco
  };

  acoes.forEach((a) => {
    const btn = el('button', { class: `btn ${a.classe || 'btn-ghost'}`, text: a.label });
    btn.addEventListener('click', async () => {
      if (a.onClick) {
        const r = await a.onClick();
        if (r === false) return; // validação impediu o fechamento
      }
      if (a.fechar !== false) fechar();
    });
    rodape.appendChild(btn);
  });

  const cab = el('div', { class: 'cab', html: `<i class="fa-solid fa-${icone}" style="color:var(--primary)" aria-hidden="true"></i><h3 id="${tituloId}">${esc(titulo)}</h3>` });
  const btnX = el('button', { class: 'icon-btn', 'aria-label': 'Fechar', title: 'Fechar', html: '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' });
  btnX.addEventListener('click', fechar);
  cab.appendChild(btnX);

  modal.append(cab, corpo, rodape);
  bg.appendChild(modal);
  bg.addEventListener('click', (e) => { if (e.target === bg) fechar(); });

  // Escape fecha; Tab fica preso dentro do modal (foco não escapa para o fundo).
  function aoTeclar(e) {
    if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
    if (e.key !== 'Tab') return;
    const foco = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!foco.length) return;
    const primeiro = foco[0], ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }
  document.addEventListener('keydown', aoTeclar);

  document.body.appendChild(bg);
  requestAnimationFrame(() => {
    bg.classList.add('aberto');
    const alvo = modal.querySelector('.corpo input, .corpo select, .corpo textarea, .corpo button')
      || rodape.querySelector('button') || btnX;
    if (alvo) alvo.focus();
  });
  return { fechar, modal };
}

export function confirmar({ titulo = 'Confirmar', mensagem, okLabel = 'Confirmar', perigo = false }) {
  return new Promise((resolve) => {
    abrirModal({
      titulo,
      icone: perigo ? 'triangle-exclamation' : 'circle-question',
      conteudo: el('p', { text: mensagem, style: 'margin:0;color:var(--muted)' }),
      acoes: [
        { label: 'Cancelar', classe: 'btn-ghost', onClick: () => resolve(false) },
        { label: okLabel, classe: perigo ? 'btn-danger' : 'btn', onClick: () => resolve(true) },
      ],
    });
  });
}
