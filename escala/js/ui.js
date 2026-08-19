// ============================================================================
//  Componentes de UI compartilhados: toast, modal e confirmação.
// ============================================================================
import { el, esc } from './util.js';

export function toast(msg, tipo = '') {
  let box = document.querySelector('.toasts');
  if (!box) {
    box = el('div', { class: 'toasts' });
    document.body.appendChild(box);
  }
  const icone = tipo === 'ok' ? 'check-circle' : tipo === 'erro' ? 'circle-exclamation' : 'circle-info';
  const t = el('div', { class: `toast ${tipo}`, html: `<i class="fa-solid fa-${icone}"></i><span>${esc(msg)}</span>` });
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
  const bg = el('div', { class: 'modal-bg' });
  const modal = el('div', { class: 'modal' });
  if (largura) modal.style.maxWidth = largura;

  const corpo = el('div', { class: 'corpo' });
  corpo.appendChild(conteudo);

  const rodape = el('div', { class: 'rodape' });
  const fechar = () => { bg.classList.remove('aberto'); setTimeout(() => bg.remove(), 150); };

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

  const cab = el('div', { class: 'cab', html: `<i class="fa-solid fa-${icone}" style="color:var(--primary)"></i><h3>${esc(titulo)}</h3>` });
  const btnX = el('button', { class: 'icon-btn', html: '<i class="fa-solid fa-xmark"></i>', style: 'width:34px;height:34px' });
  btnX.addEventListener('click', fechar);
  cab.appendChild(btnX);

  modal.append(cab, corpo, rodape);
  bg.appendChild(modal);
  bg.addEventListener('click', (e) => { if (e.target === bg) fechar(); });
  document.body.appendChild(bg);
  requestAnimationFrame(() => bg.classList.add('aberto'));
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
