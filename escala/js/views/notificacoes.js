// ============================================================================
//  Tela NOTIFICAÇÕES — ativa os avisos (push/PWA), explica os disparos e mostra
//  a próxima escala do músico logado. Envia uma notificação de teste real.
// ============================================================================
import { store } from '../data/store.js';
import { CONFIG } from '../config.js';
import { el, esc, nomeMes, parseISO, capitalizar, DIAS_SEMANA, colunaGrade } from '../util.js';
import { toast } from '../ui.js';
import * as push from '../push.js';

export async function renderNotificacoes(container, appState) {
  const pref = await store.notif.pref();
  const perm = push.permissao();
  const ativo = pref.ativado && perm === 'granted';

  container.innerHTML = '';
  container.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { text: 'Notificações' }), el('div', { class: 'sub', text: 'Lembretes automáticos da sua escala' })]),
  ]));

  // ---- Cartão principal: ativar/desativar ----
  const card = el('div', { class: 'card card-pad', style: 'margin-bottom:16px' });
  const estado = el('div', { style: 'display:flex;align-items:center;gap:14px;flex-wrap:wrap' });
  estado.append(
    el('div', { style: `width:52px;height:52px;border-radius:14px;flex:none;display:grid;place-items:center;font-size:22px;color:#fff;background:${ativo ? 'var(--st-green)' : 'var(--faint)'}`,
      html: `<i class="fa-solid fa-bell${ativo ? '' : '-slash'}"></i>` }),
    el('div', { style: 'flex:1;min-width:180px' }, [
      el('b', { text: ativo ? 'Notificações ativadas' : 'Notificações desativadas', style: 'font-size:16px;display:block' }),
      el('span', { class: 'sub', text: ativo ? 'Você receberá os lembretes neste dispositivo.' : 'Ative para receber os lembretes da sua escala.' }),
    ]),
  );
  card.appendChild(estado);

  if (perm === 'unsupported') {
    card.appendChild(el('div', { class: 'aviso-box', style: 'margin-top:14px', html:
      '<i class="fa-solid fa-circle-info"></i><div>Este navegador não suporta notificações. No iPhone, adicione o app à Tela de Início (compartilhar → “Adicionar à Tela de Início”) para habilitar.</div>' }));
  } else {
    const acoes = el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-top:14px' });
    const btn = el('button', { class: `btn ${ativo ? 'btn-ghost' : ''}`, html: ativo
      ? '<i class="fa-solid fa-bell-slash"></i> Desativar'
      : '<i class="fa-solid fa-bell"></i> Ativar notificações' });
    btn.addEventListener('click', async () => {
      try {
        if (ativo) { await push.desativar(pref.pessoaId); toast('Notificações desativadas.', 'ok'); }
        else { await push.ativar(pref.pessoaId); toast('Notificações ativadas!', 'ok'); }
        appState.recarregar();
      } catch (e) { toast(e.message || 'Não foi possível alterar.', 'erro'); }
    });
    acoes.appendChild(btn);
    if (ativo) {
      const teste = el('button', { class: 'btn-ghost btn', html: '<i class="fa-solid fa-paper-plane"></i> Enviar teste' });
      teste.addEventListener('click', async () => {
        try {
          await push.notificarTeste('🎶 Escala CSCB', 'Este é um lembrete de teste. Está tudo funcionando!');
          toast('Notificação de teste enviada.', 'ok');
        } catch (e) { toast(e.message, 'erro'); }
      });
      acoes.appendChild(teste);
    }
    card.appendChild(acoes);
  }
  container.appendChild(card);

  // ---- Quando os avisos são enviados ----
  const disparos = el('div', { class: 'card card-pad', style: 'margin-bottom:16px' });
  disparos.appendChild(el('h3', { text: 'Quando você é lembrado', style: 'font-size:15px;margin-bottom:10px' }));
  [
    ['calendar-week', 'Começo da semana', CONFIG.AVISOS.semana],
    ['sun', 'Manhã do dia', CONFIG.AVISOS.dia_manha],
    ['mug-hot', 'Início da tarde', CONFIG.AVISOS.dia_tarde],
  ].forEach(([ic, t, d]) => {
    disparos.appendChild(el('div', { style: 'display:flex;gap:12px;padding:9px 0;border-top:1px solid var(--border)' }, [
      el('i', { class: `fa-solid fa-${ic}`, style: 'color:var(--primary);width:22px;text-align:center;margin-top:3px' }),
      el('div', {}, [el('b', { text: t, style: 'display:block' }), el('span', { class: 'sub', text: d })]),
    ]));
  });
  container.appendChild(disparos);

  // ---- Minha próxima escala (para músico) ----
  if (appState.usuario) {
    const prox = await minhasProximas(appState);
    const box = el('div', { class: 'card card-pad' });
    box.appendChild(el('h3', { text: 'Sua próxima escala', style: 'font-size:15px;margin-bottom:10px' }));
    if (!prox.length) {
      box.appendChild(el('div', { class: 'sub', text: 'Você não tem missas escaladas nos próximos dias deste mês.' }));
    } else {
      prox.forEach((i) => {
        const d = parseISO(i.data);
        box.appendChild(el('div', { style: 'display:flex;gap:12px;align-items:center;padding:9px 0;border-top:1px solid var(--border)' }, [
          el('div', { style: 'width:44px;height:44px;border-radius:11px;background:var(--primary-050);color:var(--primary-700);display:grid;place-items:center;flex:none', html: `<b style="font-size:17px">${d.getDate()}</b>` }),
          el('div', {}, [
            el('b', { text: `${capitalizar(DIAS_SEMANA[colunaGrade(d)])} · ${i.horario}` }),
            el('div', { class: 'sub', text: `${nomeMes(d.getMonth() + 1)} · ${i.grupoNome}` }),
          ]),
        ]));
      });
    }
    container.appendChild(box);
  }
}

async function minhasProximas(appState) {
  const grupos = await store.grupos.listar();
  const meus = grupos.filter((g) => (g.integrantes || []).some((p) => p.id === appState.usuario.id)).map((g) => g.id);
  if (!meus.length) return [];
  const { itens } = await store.escala.obter(appState.ano, appState.mes);
  const hojeISO = new Date().toISOString().slice(0, 10);
  return itens
    .filter((i) => meus.includes(i.grupo_id) && i.data >= hojeISO)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 6);
}
