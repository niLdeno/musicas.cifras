// ============================================================================
//  Tela GESTÃO (coordenação): publicar a escala do mês, gerenciar grupos e
//  pessoas. Protegida por RLS no backend — aqui é só a interface.
// ============================================================================
import { store } from '../data/store.js';
import { el, esc, nomeMes, capitalizar } from '../util.js';
import { abrirModal, toast, confirmar } from '../ui.js';

let subAtiva = 'escala';

export async function renderAdmin(container, appState) {
  container.innerHTML = '';
  container.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { text: 'Gestão' }), el('div', { class: 'sub', text: 'Coordenação da Pastoral da Música' })]),
  ]));

  const abas = el('div', { class: 'legenda', style: 'margin-bottom:18px' });
  [['escala', 'Escala do mês', 'calendar-check'], ['grupos', 'Grupos', 'people-group'], ['pessoas', 'Pessoas', 'user']].forEach(([k, t, ic]) => {
    const chip = el('button', { class: 'chip', style: `cursor:pointer;${subAtiva === k ? 'border-color:var(--primary);color:var(--primary);background:var(--primary-050)' : ''}`,
      html: `<i class="fa-solid fa-${ic}"></i> ${t}` });
    chip.addEventListener('click', () => { subAtiva = k; renderAdmin(container, appState); });
    abas.appendChild(chip);
  });
  container.appendChild(abas);

  const alvo = el('div');
  container.appendChild(alvo);
  if (subAtiva === 'escala') await secaoEscala(alvo, appState);
  else if (subAtiva === 'grupos') await secaoGrupos(alvo, appState);
  else await secaoPessoas(alvo, appState);
}

// ---------- Escala do mês ----------
async function secaoEscala(alvo, appState) {
  const { ano, mes } = appState;
  const { escala, itens } = await store.escala.obter(ano, mes);
  const meses = await store.escala.mesesDisponiveis();
  const outros = meses.filter((m) => !(m.ano === ano && m.mes === mes));

  const card = el('div', { class: 'card card-pad' });
  card.appendChild(el('h3', { text: `${capitalizar(nomeMes(mes))} de ${ano}`, style: 'margin-bottom:6px' }));

  if (!escala) {
    card.appendChild(el('p', { class: 'sub', text: 'Ainda não há escala para este mês. Comece do zero ou use uma pré-escala abaixo.' }));
    const btn = el('button', { class: 'btn', style: 'margin-top:10px', html: '<i class="fa-solid fa-plus"></i> Criar escala em branco' });
    btn.addEventListener('click', async () => { await store.escala.criarMes(ano, mes); toast('Escala criada. Preencha os itens na aba Escala.', 'ok'); appState.recarregar(); });
    card.appendChild(btn);
    alvo.appendChild(card);
    if (outros.length) alvo.appendChild(preEscalaCard(outros, appState));
    return;
  }

  const preenchidos = itens.filter((i) => i.grupo_id || i.rotulo).length;
  const statusTxt = escala.publicada
    ? `<b style="color:var(--st-green)">Publicada</b> · v${escala.versao}`
    : '<b style="color:var(--st-orange)">Rascunho</b> (ainda não publicada)';
  card.appendChild(el('p', { class: 'sub', html: `Status: ${statusTxt} · ${preenchidos} itens preenchidos` }));

  const acoes = el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-top:12px' });
  const pub = el('button', { class: `btn ${escala.publicada ? 'btn-ghost' : 'btn-gold'}`,
    html: escala.publicada ? '<i class="fa-solid fa-eye-slash"></i> Despublicar' : '<i class="fa-solid fa-paper-plane"></i> Publicar / cadastrar' });
  pub.addEventListener('click', async () => {
    const publicar = !escala.publicada;
    const proxV = (escala.versao || 0) + 1;
    if (publicar && !(await confirmar({ titulo: 'Publicar escala', mensagem: `Publicar libera a escala para todos e cria a versão v${proxV} (base dos avisos). Continuar?`, okLabel: 'Publicar' }))) return;
    await store.escala.publicar(escala.id, publicar);
    await store.alteracoes.registrar({ escala_id: escala.id, item_id: null, descricao: publicar ? `Escala publicada (v${proxV}).` : 'Escala despublicada.', autor: appState.usuario.nome });
    toast(publicar ? `Escala publicada como v${proxV}!` : 'Escala em rascunho.', 'ok');
    appState.recarregar();
  });
  acoes.appendChild(pub);

  const irEscala = el('button', { class: 'btn-ghost btn', html: '<i class="fa-solid fa-table-cells"></i> Editar itens' });
  irEscala.addEventListener('click', () => { location.hash = '#escala'; });
  acoes.appendChild(irEscala);
  card.appendChild(acoes);
  alvo.appendChild(card);
  if (outros.length) alvo.appendChild(preEscalaCard(outros, appState));
}

// Pré-escala: usar uma escala já montada de outro mês como base.
function preEscalaCard(outros, appState) {
  const { ano, mes } = appState;
  const pre = el('div', { class: 'card card-pad', style: 'margin-top:14px' });
  pre.appendChild(el('h3', { html: '<i class="fa-solid fa-wand-magic-sparkles" style="color:var(--gold)"></i> Pré-escala', style: 'margin-bottom:4px' }));
  pre.appendChild(el('p', { class: 'sub', text: 'Copia o padrão de dias da semana de uma escala já montada (ex.: “toda 1ª segunda às 12h, Isaac”). Depois é só ajustar o necessário — itens já preenchidos não são sobrescritos.' }));
  const sel = el('select');
  outros.forEach((m) => sel.appendChild(el('option', { value: m.id, text: `${capitalizar(nomeMes(m.mes))} de ${m.ano}${m.publicada ? '' : ' (rascunho)'}` })));
  const btn = el('button', { class: 'btn btn-gold btn-sm', html: '<i class="fa-solid fa-copy"></i> Preencher a partir deste' });
  btn.addEventListener('click', async () => {
    if (!(await confirmar({ titulo: 'Aplicar pré-escala', mensagem: 'Copiar o padrão do mês escolhido para este mês?', okLabel: 'Copiar' }))) return;
    const r = await store.escala.copiarDe(sel.value, ano, mes);
    await store.alteracoes.registrar({ escala_id: r.escala.id, item_id: null, descricao: `Pré-escala aplicada: ${r.copiados} itens copiados.`, autor: appState.usuario.nome });
    toast(`${r.copiados} itens copiados. Ajuste o que precisar na aba Escala.`, 'ok');
    appState.recarregar();
  });
  const linha = el('div', { class: 'linha', style: 'margin-top:12px;align-items:flex-end' });
  linha.append(campo('Copiar de', sel));
  const w = el('div', { style: 'flex:none' }); w.appendChild(btn); linha.appendChild(w);
  pre.appendChild(linha);
  return pre;
}

// ---------- Grupos ----------
async function secaoGrupos(alvo, appState) {
  const grupos = await store.grupos.listar();
  const pessoas = await store.pessoas.listar();

  const head = el('div', { style: 'display:flex;align-items:center;margin-bottom:12px' });
  head.append(el('div', { class: 'sub', text: `${grupos.length} grupos cadastrados`, style: 'flex:1' }));
  const add = el('button', { class: 'btn btn-sm', html: '<i class="fa-solid fa-plus"></i> Novo grupo' });
  add.addEventListener('click', () => editarGrupo(null, pessoas, appState));
  head.appendChild(add);
  alvo.appendChild(head);

  const lista = el('div', { style: 'display:flex;flex-direction:column;gap:8px' });
  grupos.forEach((g) => {
    const row = el('div', { class: 'card card-pad', style: 'display:flex;align-items:center;gap:12px;padding:12px 14px' });
    row.append(
      el('div', { style: 'width:40px;height:40px;border-radius:11px;background:var(--gold-050);color:var(--gold);display:grid;place-items:center;flex:none', html: '<i class="fa-solid fa-people-group"></i>' }),
      el('div', { style: 'flex:1;min-width:0' }, [
        el('b', { text: g.nome }),
        el('div', { class: 'sub', text: (g.integrantes && g.integrantes.length) ? g.integrantes.map((p) => p.nome).join(', ') : 'Sem integrantes' }),
      ]),
    );
    const edit = el('button', { class: 'icon-btn', 'aria-label': `Editar grupo ${g.nome}`, title: 'Editar grupo', html: '<i class="fa-solid fa-pen" aria-hidden="true"></i>' });
    edit.addEventListener('click', () => editarGrupo(g, pessoas, appState));
    const del = el('button', { class: 'icon-btn', 'aria-label': `Excluir grupo ${g.nome}`, title: 'Excluir grupo', html: '<i class="fa-solid fa-trash" aria-hidden="true"></i>' });
    del.addEventListener('click', async () => {
      if (await confirmar({ titulo: 'Excluir grupo', mensagem: `Excluir "${g.nome}"?`, okLabel: 'Excluir', perigo: true })) {
        await store.grupos.remover(g.id); toast('Grupo excluído.', 'ok'); appState.recarregar();
      }
    });
    row.append(edit, del);
    lista.appendChild(row);
  });
  alvo.appendChild(lista);
}

function editarGrupo(g, pessoas, appState) {
  const form = el('div');
  const nome = el('input', { type: 'text', placeholder: 'Nome do grupo (ex.: Cânticos de Maria)', value: g ? g.nome : '' });
  form.appendChild(campo('Nome', nome));

  const membrosSel = new Set((g && g.membros) || (g && g.integrantes ? g.integrantes.map((p) => p.id) : []));
  const check = el('div', { class: 'check-list' });
  pessoas.forEach((p) => {
    const cb = el('input', { type: 'checkbox' });
    if (membrosSel.has(p.id)) cb.checked = true;
    cb.addEventListener('change', () => cb.checked ? membrosSel.add(p.id) : membrosSel.delete(p.id));
    check.appendChild(el('label', {}, [cb, p.nome]));
  });
  form.appendChild(campo('Integrantes (recebem os avisos)', check));

  abrirModal({
    titulo: g ? 'Editar grupo' : 'Novo grupo', icone: 'people-group', conteudo: form,
    acoes: [
      { label: 'Cancelar', classe: 'btn-ghost' },
      { label: 'Salvar', classe: 'btn', onClick: async () => {
        if (!nome.value.trim()) { toast('Informe o nome do grupo.', 'erro'); return false; }
        await store.grupos.salvar({ id: g ? g.id : undefined, nome: nome.value.trim(), membros: [...membrosSel] });
        toast('Grupo salvo.', 'ok'); appState.recarregar();
      }},
    ],
  });
}

// ---------- Pessoas ----------
async function secaoPessoas(alvo, appState) {
  const pessoas = await store.pessoas.listar();
  const head = el('div', { style: 'display:flex;align-items:center;margin-bottom:12px' });
  head.append(el('div', { class: 'sub', text: `${pessoas.length} pessoas cadastradas`, style: 'flex:1' }));
  const add = el('button', { class: 'btn btn-sm', html: '<i class="fa-solid fa-plus"></i> Nova pessoa' });
  add.addEventListener('click', () => editarPessoa(null, appState));
  head.appendChild(add);
  alvo.appendChild(head);

  const lista = el('div', { style: 'display:flex;flex-direction:column;gap:8px' });
  pessoas.forEach((p) => {
    const row = el('div', { class: 'card card-pad', style: 'display:flex;align-items:center;gap:12px;padding:12px 14px' });
    const inicial = (p.nome || '?').trim().charAt(0).toUpperCase();
    row.append(
      el('div', { style: 'width:40px;height:40px;border-radius:50%;background:var(--primary-050);color:var(--primary-700);display:grid;place-items:center;flex:none;font-weight:800', text: inicial }),
      el('div', { style: 'flex:1;min-width:0' }, [
        el('b', {}, [[p.nome, p.sobrenome].filter(Boolean).join(' '), p.papel !== 'musico' ? el('span', { class: 'tag', style: 'background:var(--primary);color:#fff;margin-left:6px', text: p.papel }) : null]),
        el('div', { class: 'sub', text: [p.email, p.telefone].filter(Boolean).join(' · ') || 'Sem contato' }),
      ]),
    );
    const edit = el('button', { class: 'icon-btn', 'aria-label': `Editar ${p.nome}`, title: 'Editar pessoa', html: '<i class="fa-solid fa-pen" aria-hidden="true"></i>' });
    edit.addEventListener('click', () => editarPessoa(p, appState));
    const del = el('button', { class: 'icon-btn', 'aria-label': `Excluir ${p.nome}`, title: 'Excluir pessoa', html: '<i class="fa-solid fa-trash" aria-hidden="true"></i>' });
    del.addEventListener('click', async () => {
      if (await confirmar({ titulo: 'Excluir pessoa', mensagem: `Excluir "${p.nome}"?`, okLabel: 'Excluir', perigo: true })) {
        await store.pessoas.remover(p.id); toast('Pessoa excluída.', 'ok'); appState.recarregar();
      }
    });
    row.append(edit, del);
    lista.appendChild(row);
  });
  alvo.appendChild(lista);
}

function editarPessoa(p, appState) {
  const form = el('div');
  const nome = el('input', { type: 'text', placeholder: 'Nome', value: p ? p.nome : '' });
  const sobrenome = el('input', { type: 'text', placeholder: 'Sobrenome', value: p ? p.sobrenome || '' : '' });
  const email = el('input', { type: 'email', placeholder: 'email@exemplo.com', value: p ? p.email || '' : '' });
  const tel = el('input', { type: 'tel', placeholder: '(00) 00000-0000', value: p ? p.telefone || '' : '' });
  const papel = el('select');
  [['musico', 'Músico'], ['coordenador', 'Coordenador'], ['admin', 'Administrador']].forEach(([v, t]) =>
    papel.appendChild(el('option', { value: v, text: t, selected: (p ? p.papel : 'musico') === v ? 'selected' : null })));
  const linhaNome = el('div', { class: 'linha' });
  linhaNome.append(campo('Nome', nome), campo('Sobrenome', sobrenome));
  form.append(linhaNome, campo('E-mail', email), campo('Telefone', tel), campo('Papel', papel));

  abrirModal({
    titulo: p ? 'Editar pessoa' : 'Nova pessoa', icone: 'user', conteudo: form,
    acoes: [
      { label: 'Cancelar', classe: 'btn-ghost' },
      { label: 'Salvar', classe: 'btn', onClick: async () => {
        if (!nome.value.trim()) { toast('Informe o nome.', 'erro'); return false; }
        await store.pessoas.salvar({ id: p ? p.id : undefined, nome: nome.value.trim(), sobrenome: sobrenome.value.trim() || null, email: email.value.trim() || null, telefone: tel.value.trim() || null, papel: papel.value });
        toast('Pessoa salva.', 'ok'); appState.recarregar();
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
