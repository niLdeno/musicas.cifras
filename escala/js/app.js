// ============================================================================
//  Bootstrap do aplicativo: login, shell (sidebar/topbar/tabbar), roteamento
//  por hash e estado global. Coordena todas as telas.
// ============================================================================
import { initStore, store } from './data/store.js';
import { CONFIG, modoDemo } from './config.js';
import { el, esc, nomeMes, capitalizar } from './util.js';
import { toast } from './ui.js';
import { renderEscala } from './views/escala.js';
import { renderComunicados } from './views/comunicados.js';
import { renderAlteracoes } from './views/alteracoes.js';
import { renderNotificacoes } from './views/notificacoes.js';
import { renderAdmin } from './views/admin.js';

const hoje = new Date();
const appState = {
  usuario: null,
  ehGestor: false,
  ano: hoje.getFullYear(),
  mes: hoje.getMonth() + 1,
  navegarMes,
  recarregar,
};

const ROTAS = {
  escala:       { titulo: 'Escala',        icone: 'calendar-days',      render: renderEscala },
  comunicados:  { titulo: 'Comunicados',   icone: 'bullhorn',           render: renderComunicados },
  alteracoes:   { titulo: 'Alterações',    icone: 'clock-rotate-left',  render: renderAlteracoes },
  notificacoes: { titulo: 'Notificações',  icone: 'bell',               render: renderNotificacoes },
  admin:        { titulo: 'Gestão',        icone: 'sliders',            render: renderAdmin, gestor: true },
};

let rotaAtual = 'escala';

// ---------------------------------------------------------------------------
function aplicarUsuario(usuario) {
  appState.usuario = usuario;
  appState.ehGestor = !!usuario && (usuario.papel === 'admin' || usuario.papel === 'coordenador');
  document.body.classList.toggle('eh-gestor', appState.ehGestor);
  if (usuario) montarApp(); else mostrarLogin();
}

async function iniciar() {
  aplicarTemaSalvo();
  window.addEventListener('hashchange', rotear); // registrado UMA vez (evita listeners duplicados)
  await initStore();

  // O Supabase dispara um evento inicial no `aoMudar` (INITIAL_SESSION); por isso,
  // nesse modo NÃO fazemos bootstrap manual — evitaria montar a app duas vezes.
  // O mock não emite evento inicial, então lá buscamos o usuário atual na mão.
  store.auth.aoMudar(aplicarUsuario);
  if (store.modo === 'demo') {
    aplicarUsuario(await store.auth.usuarioAtual());
  }
}

// ---------------------------------------------------------------------------
//  LOGIN
// ---------------------------------------------------------------------------
function mostrarLogin() {
  document.getElementById('app').classList.remove('pronto');
  const raiz = document.getElementById('login-raiz');
  raiz.innerHTML = '';
  const card = el('div', { class: 'login-card' });
  card.append(
    el('div', { class: 'mark', html: '<i class="fa-solid fa-music"></i>' }),
    el('h1', { text: 'Escala da Música' }),
    el('div', { class: 'igreja', html: `${esc(CONFIG.IGREJA)}<br>${esc(CONFIG.PASTORAL)} · ${esc(CONFIG.PAROQUIA)}` }),
  );

  if (modoDemo()) {
    card.append(el('div', { class: 'demo-tag', html: '<i class="fa-solid fa-flask"></i> Modo demonstração' }));
    const bAdmin = el('button', { class: 'btn btn-block', style: 'margin-bottom:10px', html: '<i class="fa-solid fa-user-shield"></i> Entrar como Coordenação' });
    bAdmin.addEventListener('click', () => store.auth.entrarDemo('admin'));
    const bMusico = el('button', { class: 'btn btn-ghost btn-block', html: '<i class="fa-solid fa-guitar"></i> Entrar como Músico' });
    bMusico.addEventListener('click', () => store.auth.entrarDemo('musico'));
    card.append(bAdmin, bMusico);
    card.append(el('div', { class: 'rodape-cred', text: 'Demonstração offline — os dados ficam só neste navegador.' }));
  } else {
    card.append(loginSupabase());
  }

  const wrap = el('div', { class: 'login' });
  wrap.appendChild(card);
  raiz.appendChild(wrap);
}

function loginSupabase() {
  const form = el('form');
  const email = el('input', { type: 'email', placeholder: 'seu e-mail', required: 'required' });
  const senha = el('input', { type: 'password', placeholder: 'sua senha', required: 'required' });
  form.append(
    campoLogin('E-mail', email), campoLogin('Senha', senha),
    el('button', { class: 'btn btn-block', type: 'submit', html: '<i class="fa-solid fa-right-to-bracket"></i> Entrar' }),
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await store.auth.entrar(email.value.trim(), senha.value); }
    catch (err) { toast(err.message || 'Não foi possível entrar.', 'erro'); }
  });
  const links = el('div', { style: 'margin-top:14px;display:flex;flex-direction:column;gap:8px' });
  const esqueci = el('a', { style: 'cursor:pointer;font-size:13px', text: 'Esqueci minha senha' });
  esqueci.addEventListener('click', async () => {
    if (!email.value.trim()) return toast('Digite seu e-mail primeiro.', 'erro');
    try { await store.auth.recuperarSenha(email.value.trim()); toast('Enviamos um link de recuperação.', 'ok'); }
    catch (err) { toast(err.message, 'erro'); }
  });
  links.appendChild(esqueci);
  const box = el('div');
  box.append(form, links);
  return box;
}

function campoLogin(label, input) {
  if (!input.id) input.id = 'login-' + Math.random().toString(36).slice(2, 9);
  const c = el('div', { class: 'campo', style: 'text-align:left' });
  c.append(el('label', { text: label, for: input.id }), input);
  return c;
}

// ---------------------------------------------------------------------------
//  SHELL + ROTEAMENTO
// ---------------------------------------------------------------------------
function montarApp() {
  const raiz = document.getElementById('login-raiz');
  raiz.innerHTML = '';
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.classList.add('pronto');

  app.append(sidebar(), topbar(), mainEl(), tabbar());
  rotear();
}

function itensNav() {
  return Object.entries(ROTAS).filter(([, r]) => !r.gestor || appState.ehGestor);
}

function sidebar() {
  const aside = el('aside', { class: 'sidebar' });
  aside.append(el('div', { class: 'brand' }, [
    el('div', { class: 'mark', html: '<i class="fa-solid fa-music"></i>' }),
    el('div', {}, [el('b', { text: 'Escala' }), el('small', { text: CONFIG.SIGLA })]),
  ]));
  const nav = el('nav', { class: 'nav' });
  itensNav().forEach(([k, r]) => {
    const wrapAdmin = r.gestor;
    const a = el('a', { dataset: { rota: k }, href: `#${k}`, html: `<i class="fa-solid fa-${r.icone}"></i> <span>${r.titulo}</span>` });
    if (wrapAdmin) { const g = el('div', { class: 'grupo-admin' }); g.append(el('div', { class: 'rot', text: 'Coordenação' }), a); nav.appendChild(g); }
    else nav.appendChild(a);
  });
  aside.appendChild(nav);

  const temaBtn = el('button', { class: 'side-tema', 'aria-label': 'Alternar tema claro ou escuro', title: 'Tema claro/escuro',
    html: '<i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i><span>Tema claro/escuro</span>' });
  temaBtn.addEventListener('click', alternarTema);
  aside.appendChild(temaBtn);

  const user = el('div', { class: 'side-user', role: 'button', tabindex: '0',
    'aria-label': `Sair da conta de ${appState.usuario?.nome || ''}`, title: 'Sair' }, [
    el('div', { class: 'av', text: (appState.usuario?.nome || '?').charAt(0).toUpperCase(), 'aria-hidden': 'true' }),
    el('div', { style: 'flex:1;min-width:0' }, [
      el('b', { text: appState.usuario?.nome || '' }),
      el('small', { text: appState.ehGestor ? 'Coordenação' : 'Músico' }),
    ]),
    el('i', { class: 'fa-solid fa-right-from-bracket', style: 'color:#a9abd6', 'aria-hidden': 'true' }),
  ]);
  user.addEventListener('click', sair);
  user.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sair(); } });
  aside.appendChild(user);
  return aside;
}

function topbar() {
  const bar = el('div', { class: 'topbar' });
  bar.append(
    el('div', { class: 'mark', html: '<i class="fa-solid fa-music"></i>' }),
    el('div', {}, [el('b', { text: 'Escala' }), el('small', { text: CONFIG.SIGLA })]),
  );
  const acoes = el('div', { class: 'acoes' });
  const tema = el('button', { class: 'icon-btn', html: '<i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i>', title: 'Tema', 'aria-label': 'Alternar tema claro ou escuro' });
  tema.addEventListener('click', alternarTema);
  const out = el('button', { class: 'icon-btn', html: '<i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>', title: 'Sair', 'aria-label': 'Sair da conta' });
  out.addEventListener('click', sair);
  acoes.append(tema, out);
  bar.appendChild(acoes);
  return bar;
}

function tabbar() {
  const bar = el('nav', { class: 'tabbar' });
  itensNav().forEach(([k, r]) => {
    bar.appendChild(el('a', { dataset: { rota: k }, href: `#${k}`, html: `<i class="fa-solid fa-${r.icone}"></i><span>${r.titulo}</span>` }));
  });
  return bar;
}

function mainEl() {
  return el('main', { class: 'main', id: 'conteudo' });
}

async function rotear() {
  let alvo = (location.hash || '#escala').slice(1);
  if (!ROTAS[alvo] || (ROTAS[alvo].gestor && !appState.ehGestor)) alvo = 'escala';
  rotaAtual = alvo;
  document.querySelectorAll('[data-rota]').forEach((a) => a.classList.toggle('ativo', a.dataset.rota === alvo));
  const conteudo = document.getElementById('conteudo');
  if (!conteudo) return;
  conteudo.innerHTML = '<div class="vazio-estado"><i class="fa-solid fa-spinner spin"></i></div>';
  try {
    await ROTAS[alvo].render(conteudo, appState);
  } catch (e) {
    console.error(e);
    conteudo.innerHTML = '';
    conteudo.appendChild(el('div', { class: 'vazio-estado card', html: `<i class="fa-solid fa-triangle-exclamation"></i><h3>Erro ao carregar</h3><p>${esc(e.message || '')}</p>` }));
  }
}

function recarregar() { rotear(); }

function navegarMes(delta) {
  let m = appState.mes + delta, a = appState.ano;
  if (m < 1) { m = 12; a--; } else if (m > 12) { m = 1; a++; }
  appState.mes = m; appState.ano = a;
  if (rotaAtual === 'escala' || rotaAtual === 'alteracoes' || rotaAtual === 'admin' || rotaAtual === 'notificacoes') rotear();
}

async function sair() {
  await store.auth.sair();
  location.hash = '';
}

// ---------------------------------------------------------------------------
//  TEMA
// ---------------------------------------------------------------------------
function aplicarTemaSalvo() {
  const t = localStorage.getItem('cscb.tema');
  if (t) document.documentElement.setAttribute('data-theme', t);
}
function alternarTema() {
  const atual = document.documentElement.getAttribute('data-theme');
  const novo = atual === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  localStorage.setItem('cscb.tema', novo);
}

// registra o service worker (PWA) sem bloquear o boot
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

iniciar();
