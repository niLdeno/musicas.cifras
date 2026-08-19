// ============================================================================
//  Tela ESCALA — grade mensal fiel à escala oficial (desktop) + cartões por dia
//  (celular). A coordenação edita cada item; todos visualizam.
// ============================================================================
import { store } from '../data/store.js';
import { STATUS, STATUS_LEGENDA } from '../config.js';
import {
  el, esc, semanasDoMes, DIAS_SEMANA, DIAS_CURTOS, nomeMes, capitalizar, parseISO, mesmaData, toISO,
} from '../util.js';
import { abrirModal, toast, confirmar } from '../ui.js';

let ctx; // { ano, mes, usuario, ehGestor, navegarMes }

export async function renderEscala(container, appState) {
  ctx = appState;
  const { ano, mes, ehGestor } = ctx;
  const { escala, itens } = await store.escala.obter(ano, mes);
  const grupos = await store.grupos.listar();

  const itemPorChave = {};
  itens.forEach((i) => (itemPorChave[`${i.data}|${i.horario}`] = i));

  container.innerHTML = '';
  container.appendChild(cabecalho(escala));
  container.appendChild(legenda());

  if (!escala) {
    container.appendChild(estadoVazio(ehGestor));
    return;
  }
  if (!escala.publicada && !ehGestor) {
    container.appendChild(estadoVazio(false, true));
    return;
  }
  if (!escala.publicada && ehGestor) {
    container.appendChild(
      el('div', { class: 'aviso-box', style: 'margin-bottom:14px', html:
        '<i class="fa-solid fa-eye-slash"></i><div>Esta escala está em <b>rascunho</b> — só a coordenação a vê. Publique em <b>Gestão</b> para liberar aos músicos.</div>' })
    );
  }

  const semanas = semanasDoMes(ano, mes);
  container.appendChild(gradeDesktop(semanas, itemPorChave, grupos, escala));
  container.appendChild(gradeMobile(semanas, itemPorChave, grupos, escala));
}

function cabecalho(escala) {
  const head = el('div', { class: 'page-head' });
  head.appendChild(el('div', {}, [
    el('h1', { text: 'Escala' }),
    el('div', { class: 'sub', html: `${esc(nomeMes(ctx.mes))} de ${ctx.ano} · Missas 12h e 19h${escala && escala.versao ? ` · v${escala.versao}` : ''}` }),
  ]));

  const nav = el('div', { class: 'mes-nav' });
  const antes = el('button', { html: '<i class="fa-solid fa-chevron-left"></i>', title: 'Mês anterior' });
  const depois = el('button', { html: '<i class="fa-solid fa-chevron-right"></i>', title: 'Próximo mês' });
  antes.addEventListener('click', () => ctx.navegarMes(-1));
  depois.addEventListener('click', () => ctx.navegarMes(1));
  nav.append(antes, el('div', { class: 'rot', text: `${capitalizar(nomeMes(ctx.mes))} ${ctx.ano}` }), depois);

  const push = el('div', { class: 'push' });
  push.appendChild(nav);
  head.appendChild(push);
  return head;
}

function legenda() {
  const box = el('div', { class: 'legenda' });
  STATUS_LEGENDA.forEach((k) => {
    box.appendChild(el('span', { class: 'chip' }, [
      el('span', { class: 'dot', style: `background:${STATUS[k].cor}` }),
      STATUS[k].legenda,
    ]));
  });
  return box;
}

function estadoVazio(ehGestor, aguardando = false) {
  const box = el('div', { class: 'vazio-estado card' });
  if (aguardando) {
    box.innerHTML = '<i class="fa-solid fa-hourglass-half"></i><h3>Escala ainda não publicada</h3><p>A coordenação está preparando a escala deste mês. Você será avisado quando ela for publicada.</p>';
    return box;
  }
  box.innerHTML = `<i class="fa-regular fa-calendar-xmark"></i><h3>Sem escala para este mês</h3><p>${ehGestor ? 'Crie a escala deste mês na aba Gestão.' : 'Ainda não há escala publicada para este período.'}</p>`;
  return box;
}

// ---------- Desktop: tabela ----------
function gradeDesktop(semanas, itemPorChave, grupos, escala) {
  const wrap = el('div', { class: 'grade-wrap' });
  const tabela = el('table', { class: 'grade' });

  const thead = el('thead');
  const trh = el('tr');
  trh.appendChild(el('th', { text: 'Semana' }));
  DIAS_SEMANA.forEach((d) => trh.appendChild(el('th', { text: d })));
  thead.appendChild(trh);
  tabela.appendChild(thead);

  const tbody = el('tbody');
  const hoje = new Date();
  semanas.forEach((sem) => {
    const tr = el('tr');
    tr.appendChild(el('td', { class: 'wk-cell', html: `<span>${sem.semana}ª semana</span>` }));
    for (let col = 0; col < 7; col++) {
      const dia = sem.dias.find((d) => d.coluna === col);
      if (!dia) { tr.appendChild(el('td', { class: 'dia-cell vazio' })); continue; }
      const td = el('td', { class: 'dia-cell' + (mesmaData(dia.date, hoje) ? ' hoje' : '') });
      td.appendChild(el('div', { class: 'dia-num', html: `<b>${dia.date.getDate()}</b> de ${nomeMes(ctx.mes)}` }));
      dia.horarios.forEach((h) => td.appendChild(slotEl(itemPorChave[`${dia.iso}|${h}`], dia, h, grupos, escala)));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  tabela.appendChild(tbody);
  wrap.appendChild(tabela);
  return wrap;
}

// ---------- Mobile: cartões ----------
function gradeMobile(semanas, itemPorChave, grupos, escala) {
  const box = el('div', { class: 'dias-mobile' });
  const hoje = new Date();
  semanas.forEach((sem) => {
    sem.dias.forEach((dia) => {
      const card = el('div', { class: 'dia-card' + (mesmaData(dia.date, hoje) ? ' hoje' : '') });
      const nomeSem = DIAS_SEMANA[dia.coluna];
      card.appendChild(el('div', { class: 'cab' }, [
        el('div', { class: 'dnum', html: `<b>${dia.date.getDate()}</b><small>${DIAS_CURTOS[dia.coluna]}</small>` }),
        el('div', { class: 'dsem', html: `${capitalizar(nomeSem)}<small>${nomeMes(ctx.mes)} · ${dia.horarios.join(' e ')}</small>` }),
        el('div', { class: 'semtag', text: `${sem.semana}ª sem.` }),
      ]));
      const corpo = el('div', { class: 'corpo' });
      dia.horarios.forEach((h) => corpo.appendChild(slotEl(itemPorChave[`${dia.iso}|${h}`], dia, h, grupos, escala)));
      card.appendChild(corpo);
      box.appendChild(card);
    });
  });
  return box;
}

function slotEl(item, dia, horario, grupos, escala) {
  const st = item ? item.status : 'confirmada';
  const clic = ctx.ehGestor;
  const s = el('div', { class: `slot st-${st}` + (clic ? ' clicavel' : '') + (item ? '' : ' vazio-slot') });
  const meta = STATUS[st];
  const tag = item && st !== 'confirmada' ? `<span class="tag ${st}">${esc(meta.curta)}</span>` : '';
  const nome = item ? esc(item.grupoNome || item.rotulo || 'A definir') : 'A definir';
  s.innerHTML = `<span class="hora">${horario}</span><span class="nome">${nome}</span>${tag}` +
    (item && item.observacao ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">${esc(item.observacao)}</div>` : '');
  if (clic) s.addEventListener('click', () => editarItem(item, dia, horario, grupos, escala));
  return s;
}

// ---------- Edição de um item (coordenação) ----------
async function editarItem(item, dia, horario, grupos, escala) {
  const form = el('div');
  const dataLabel = `${dia.date.getDate()} de ${nomeMes(ctx.mes)} · ${horario}`;
  form.appendChild(el('div', { class: 'aviso-box', style: 'margin-bottom:14px', html:
    `<i class="fa-solid fa-calendar-day"></i><div><b>${capitalizar(DIAS_SEMANA[dia.coluna])}</b>, ${dataLabel}</div>` }));

  const selGrupo = el('select');
  selGrupo.appendChild(el('option', { value: '', text: '— A definir / texto livre —' }));
  grupos.forEach((g) => selGrupo.appendChild(el('option', { value: g.id, text: g.nome, selected: item && item.grupo_id === g.id ? 'selected' : null })));

  const inputLivre = el('input', { type: 'text', placeholder: 'Ou digite um nome livre (ex.: dupla convidada)', value: item && !item.grupo_id ? (item.rotulo || '') : '' });

  const selStatus = el('select');
  Object.entries(STATUS).forEach(([k, v]) =>
    selStatus.appendChild(el('option', { value: k, text: v.label, selected: (item ? item.status : 'confirmada') === k ? 'selected' : null }))
  );

  const obs = el('textarea', { placeholder: 'Observação (opcional)', text: item ? item.observacao || '' : '' });

  form.append(
    campo('Grupo / músico', selGrupo),
    campo('Nome livre (se não houver grupo cadastrado)', inputLivre),
    campo('Status (legenda)', selStatus),
    campo('Observação', obs),
  );

  const acoes = [{ label: 'Cancelar', classe: 'btn-ghost' }];
  if (item) acoes.push({ label: 'Remover', classe: 'btn-danger', fechar: false, onClick: async () => {
    if (!(await confirmar({ titulo: 'Remover item', mensagem: 'Remover este item da escala?', okLabel: 'Remover', perigo: true }))) return false;
    await store.escala.removerItem(item.id);
    await store.alteracoes.registrar({ escala_id: escala.id, item_id: null, descricao: `${dataLabel}: item removido.`, autor: ctx.usuario.nome });
    toast('Item removido.', 'ok');
    document.querySelector('.modal-bg')?.remove();
    ctx.recarregar();
    return true;
  }});
  acoes.push({ label: 'Salvar', classe: 'btn', onClick: async () => {
    const grupoId = selGrupo.value || null;
    const rotulo = grupoId ? null : (inputLivre.value.trim() || null);
    const payload = {
      id: item ? item.id : undefined,
      escala_id: escala.id, data: dia.iso, horario,
      grupo_id: grupoId, rotulo, status: selStatus.value,
      observacao: obs.value.trim() || null,
    };
    await store.escala.salvarItem(payload);
    const nome = grupoId ? grupos.find((g) => g.id === grupoId)?.nome : rotulo || 'A definir';
    await store.alteracoes.registrar({ escala_id: escala.id, item_id: null, descricao: `${dataLabel}: ${nome} (${STATUS[selStatus.value].label}).`, autor: ctx.usuario.nome });
    toast('Escala atualizada.', 'ok');
    ctx.recarregar();
  }});

  abrirModal({ titulo: 'Editar escala', icone: 'pen-to-square', conteudo: form, acoes });
}

function campo(label, controle) {
  const c = el('div', { class: 'campo' });
  c.appendChild(el('label', { text: label }));
  c.appendChild(controle);
  return c;
}
