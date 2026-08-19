// ============================================================================
//  Tela ALTERAÇÕES — histórico de mudanças da escala do mês (linha do tempo).
// ============================================================================
import { store } from '../data/store.js';
import { el, esc, nomeMes, capitalizar } from '../util.js';

function quando(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export async function renderAlteracoes(container, appState) {
  const { ano, mes } = appState;
  const { escala } = await store.escala.obter(ano, mes);

  container.innerHTML = '';
  const head = el('div', { class: 'page-head' });
  head.append(el('div', {}, [
    el('h1', { text: 'Alterações' }),
    el('div', { class: 'sub', text: `Mudanças na escala de ${nomeMes(mes)} de ${ano}` }),
  ]));
  container.appendChild(head);

  container.appendChild(el('div', { class: 'aviso-box', style: 'margin-bottom:16px', html:
    '<i class="fa-solid fa-clock-rotate-left"></i><div>Toda alteração feita pela coordenação fica registrada aqui, para todos acompanharem os ajustes do mês.</div>' }));

  if (!escala) {
    container.appendChild(el('div', { class: 'vazio-estado card', html:
      '<i class="fa-regular fa-calendar"></i><h3>Sem escala neste mês</h3>' }));
    return;
  }

  const lista = await store.alteracoes.listar(escala.id);
  if (!lista.length) {
    container.appendChild(el('div', { class: 'vazio-estado card', html:
      '<i class="fa-solid fa-check"></i><h3>Nenhuma alteração</h3><p>A escala deste mês está como foi publicada.</p>' }));
    return;
  }

  const card = el('div', { class: 'card card-pad' });
  const tl = el('div', { class: 'timeline' });
  lista.forEach((a) => {
    tl.appendChild(el('div', { class: 'item' }, [
      el('div', { class: 'desc', text: a.descricao }),
      el('div', { class: 'quando', text: `${quando(a.criado_em)} · ${a.autor || 'Coordenação'}` }),
    ]));
  });
  card.appendChild(tl);
  container.appendChild(card);
}
