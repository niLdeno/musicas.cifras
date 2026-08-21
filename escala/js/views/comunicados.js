// ============================================================================
//  Tela COMUNICADOS — mural de avisos da coordenação.
// ============================================================================
import { store } from '../data/store.js';
import { el, esc } from '../util.js';
import { abrirModal, toast, confirmar } from '../ui.js';

function dataBonita(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export async function renderComunicados(container, appState) {
  const lista = await store.comunicados.listar();
  container.innerHTML = '';

  const head = el('div', { class: 'page-head' });
  head.append(
    el('div', {}, [el('h1', { text: 'Comunicados' }), el('div', { class: 'sub', text: 'Avisos e recados da coordenação' })])
  );
  if (appState.ehGestor) {
    const btn = el('button', { class: 'btn somente-gestor', html: '<i class="fa-solid fa-plus"></i> Novo comunicado' });
    btn.addEventListener('click', () => editar(null, appState));
    head.append(el('div', { class: 'push' }, [btn]));
  }
  container.appendChild(head);

  if (!lista.length) {
    container.appendChild(el('div', { class: 'vazio-estado card', html:
      '<i class="fa-regular fa-bell"></i><h3>Nenhum comunicado ainda</h3><p>Os avisos da coordenação aparecem aqui.</p>' }));
    return;
  }

  const box = el('div');
  lista.forEach((c) => box.appendChild(cardComunicado(c, appState)));
  container.appendChild(box);
}

function cardComunicado(c, appState) {
  const card = el('div', { class: 'card card-pad comunicado' });
  const top = el('div', { class: 'top' });
  if (c.fixado) top.appendChild(el('i', { class: 'fa-solid fa-thumbtack pin', title: 'Fixado' }));
  top.appendChild(el('h3', { text: c.titulo, style: 'flex:1' }));
  if (appState.ehGestor) {
    const edit = el('button', { class: 'icon-btn', 'aria-label': 'Editar comunicado', title: 'Editar comunicado', html: '<i class="fa-solid fa-pen" aria-hidden="true"></i>' });
    edit.addEventListener('click', () => editar(c, appState));
    const del = el('button', { class: 'icon-btn', 'aria-label': 'Excluir comunicado', title: 'Excluir comunicado', html: '<i class="fa-solid fa-trash" aria-hidden="true"></i>' });
    del.addEventListener('click', async () => {
      if (await confirmar({ titulo: 'Excluir comunicado', mensagem: `Excluir "${c.titulo}"?`, okLabel: 'Excluir', perigo: true })) {
        await store.comunicados.remover(c.id);
        toast('Comunicado excluído.', 'ok');
        appState.recarregar();
      }
    });
    top.append(edit, del);
  }
  card.appendChild(top);
  card.appendChild(el('div', { class: 'meta', text: `${c.autor || 'Coordenação'} · ${dataBonita(c.criado_em)}` }));
  card.appendChild(el('div', { class: 'corpo', text: c.corpo }));
  return card;
}

function editar(c, appState) {
  const form = el('div');
  const titulo = el('input', { type: 'text', placeholder: 'Título do comunicado', value: c ? c.titulo : '' });
  const corpo = el('textarea', { placeholder: 'Escreva o comunicado...', text: c ? c.corpo : '' });
  corpo.style.minHeight = '140px';
  const fixado = el('input', { type: 'checkbox' });
  if (c && c.fixado) fixado.checked = true;

  form.append(
    campo('Título', titulo),
    campo('Mensagem', corpo),
    el('label', { class: 'campo', style: 'display:flex;align-items:center;gap:8px;flex-direction:row' }, [
      fixado, el('span', { text: 'Fixar no topo', style: 'font-weight:600;color:var(--text)' }),
    ]),
  );

  abrirModal({
    titulo: c ? 'Editar comunicado' : 'Novo comunicado',
    icone: 'bullhorn',
    conteudo: form,
    acoes: [
      { label: 'Cancelar', classe: 'btn-ghost' },
      { label: 'Publicar', classe: 'btn', onClick: async () => {
        if (!titulo.value.trim() || !corpo.value.trim()) { toast('Preencha título e mensagem.', 'erro'); return false; }
        await store.comunicados.salvar({
          id: c ? c.id : undefined,
          titulo: titulo.value.trim(), corpo: corpo.value.trim(),
          fixado: fixado.checked, publicado: true, autor: appState.usuario.nome,
        });
        toast('Comunicado salvo.', 'ok');
        appState.recarregar();
      }},
    ],
  });
}

function campo(label, controle) {
  if (!controle.id) controle.id = 'campo-' + Math.random().toString(36).slice(2, 9);
  const c = el('div', { class: 'campo' });
  c.append(el('label', { text: label, for: controle.id }), controle);
  return c;
}
