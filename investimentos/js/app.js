// ============================================================================
//  Bootstrap: menu, roteamento por hash, tema, "ocultar valores" e atualização
//  de cotações. A carteira é recalculada a partir dos lançamentos sempre que
//  os dados mudam — a fonte da verdade são as operações, nunca um saldo salvo.
// ============================================================================
import { store } from './data/store.js';
import { buscarCotacoes } from './data/cotacoes.js';
import { dadosDemo } from './data/demo.js';
import { montarCarteira } from './core/portfolio.js';
import { $, esc, toast, instalarBaloes, hojeISO, tempoRelativo } from './ui/dom.js';
import { limparGraficos } from './ui/graficos.js';
import { renderPainel } from './views/painel.js';
import { renderCarteira } from './views/carteira.js';
import { renderAtivo } from './views/ativo.js';
import { renderLancamentos } from './views/lancamentos.js';
import { renderProventos } from './views/proventos.js';
import { renderIR } from './views/ir.js';
import { renderAprender } from './views/aprender.js';
import { renderConfig } from './views/config.js';
import { escolherNovaOperacao } from './views/formularios.js';

const ICONES = {
  painel: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  carteira: '<path d="M3 7h18v13H3z"/><path d="M16 13h2M3 7l3-4h12l3 4"/>',
  lancamentos: '<path d="M7 4h10M7 9h10M7 14h6M4 4h.01M4 9h.01M4 14h.01M15 19l2 2 4-4"/>',
  proventos: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  ir: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  aprender: '<path d="M2 8l10-5 10 5-10 5z"/><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
};

const ROTAS = {
  painel:      { titulo: 'Painel',          render: renderPainel,      aba: true },
  carteira:    { titulo: 'Carteira',        render: renderCarteira,    aba: true },
  lancamentos: { titulo: 'Operações',       render: renderLancamentos, aba: true },
  proventos:   { titulo: 'Proventos',       render: renderProventos,   aba: true },
  ir:          { titulo: 'Imposto de Renda', render: renderIR,         aba: false },
  aprender:    { titulo: 'Aprenda',         render: renderAprender,    aba: true },
  config:      { titulo: 'Configurações',   render: renderConfig,      aba: false },
};

let cache = null; // carteira calculada para o estado atual
let atualizando = false;

export function contexto() {
  const estado = store.get();
  const hoje = hojeISO();
  if (!cache || cache.estado !== estado || cache.versao !== versaoDados) {
    cache = { estado, versao: versaoDados, carteira: montarCarteira({ ...estado, hoje }) };
  }
  return { estado, hoje, carteira: cache.carteira, atualizarCotacoes, navegar };
}
let versaoDados = 0;

export function navegar(rota) { location.hash = '#/' + rota; }

function rotaAtual() {
  const [nome = 'painel', ...resto] = location.hash.replace(/^#\/?/, '').split('/');
  return { nome: ROTAS[nome] || nome === 'ativo' ? nome : 'painel', param: decodeURIComponent(resto.join('/')) };
}

function montarMenu() {
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[k]}</svg>`;
  $('#menu').innerHTML = Object.entries(ROTAS).map(([k, r]) =>
    `<a href="#/${k}" data-rota="${k}">${svg(k)}<span>${r.titulo}</span></a>`).join('');
  $('#abas').innerHTML = Object.entries(ROTAS).filter(([, r]) => r.aba).map(([k, r]) =>
    `<a href="#/${k}" data-rota="${k}">${svg(k)}<span>${r.titulo}</span></a>`).join('') +
    `<a href="#/config" data-rota="config">${svg('config')}<span>Mais</span></a>`;
}

function render() {
  const { nome, param } = rotaAtual();
  // Troca o <main> por um clone vazio: descarta os ouvintes da tela anterior
  const antigo = $('#conteudo');
  const main = antigo.cloneNode(false);
  antigo.replaceWith(main);
  const ctx = contexto();
  const marcada = nome === 'ativo' ? 'carteira' : nome === 'ir' ? 'config' : nome;
  document.querySelectorAll('[data-rota]').forEach((a) => {
    const ativo = a.closest('#menu') ? a.dataset.rota === (nome === 'ativo' ? 'carteira' : nome) : a.dataset.rota === marcada;
    a.classList.toggle('ativo', !!ativo);
    if (ativo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  const titulo = nome === 'ativo' ? param : ROTAS[nome].titulo;
  $('#titulo-pagina').textContent = titulo;
  document.title = `${titulo} · Minha Carteira`;
  try {
    if (nome === 'ativo') renderAtivo(main, ctx, param);
    else ROTAS[nome].render(main, ctx);
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="cartao vazio"><h2>Algo deu errado</h2><p>${esc(e.message)}</p></div>`;
  }
  limparGraficos();
  atualizarStatusCotacao();
  atualizarFaixaDemo();
}

function atualizarStatusCotacao() {
  const { estado, carteira } = contexto();
  const datas = Object.values(estado.cotacoes).map((c) => c.atualizadoEm).filter(Boolean).sort();
  const ult = datas[datas.length - 1];
  const s = $('#status-cotacao');
  if (!carteira.resumo.ativosAbertos) { s.textContent = ''; return; }
  s.textContent = atualizando ? 'Atualizando cotações…' : `Cotações ${tempoRelativo(ult)}${carteira.resumo.semCotacao ? ` · ${carteira.resumo.semCotacao} sem cotação` : ''}`;
}

function atualizarFaixaDemo() {
  const f = $('#faixa-demo');
  f.hidden = !store.get().config.demo;
  f.innerHTML = 'Você está vendo uma <b>carteira de demonstração</b> com dados fictícios. '
    + '<button type="button" class="link" data-acao="sair-demo">Começar a minha carteira</button>';
}

// ---------------------------------------------------------------------------
async function atualizarCotacoes({ silencioso = false } = {}) {
  if (atualizando) return;
  const { estado, carteira, hoje } = contexto();
  if (estado.config.demo) { if (!silencioso) toast('Na demonstração as cotações são fictícias. Comece sua carteira para ver cotações reais.', 'info'); return; }
  const tickers = carteira.posicoes.filter((p) => p.aberta).map((p) => p.ticker);
  if (!tickers.length) { if (!silencioso) toast('Cadastre uma compra para buscar cotações.', 'info'); return; }
  if (!navigator.onLine) { if (!silencioso) toast('Sem conexão com a internet.', 'erro'); return; }

  atualizando = true;
  $('#btn-atualizar').classList.add('girando');
  atualizarStatusCotacao();
  try {
    const { cotacoes, falhas } = await buscarCotacoes(tickers, estado.config.tokenBrapi);
    if (Object.keys(cotacoes).length) store.atualizarCotacoes(cotacoes);
    const c = contexto().carteira;
    store.registrarFotografia(hoje, c.resumo.patrimonio, c.resumo.custo);
    if (!silencioso || falhas.length) {
      if (!falhas.length) toast(`Cotações atualizadas (${tickers.length} ativos).`);
      else {
        const precisaToken = falhas.some((f) => /token/.test(f.motivo));
        toast(`${falhas.length} de ${tickers.length} sem cotação: ${falhas.slice(0, 4).map((f) => `${f.ticker} (${f.motivo})`).join(', ')}`
          + (precisaToken ? '. Cadastre um token gratuito da brapi.dev em Configurações ou informe o preço manualmente.' : ''), 'aviso', 8000);
      }
    }
  } catch (e) {
    toast('Não foi possível atualizar as cotações: ' + e.message, 'erro');
  } finally {
    atualizando = false;
    $('#btn-atualizar').classList.remove('girando');
    render();
  }
}

// ---------------------------------------------------------------------------
function aplicarTema() {
  const { tema } = store.get().config;
  if (tema === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', tema);
}
function temaEfetivo() {
  const t = store.get().config.tema;
  if (t !== 'auto') return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function aplicarOcultar() {
  const o = store.get().config.ocultarValores;
  document.body.classList.toggle('ocultar', o);
  $('#btn-ocultar').setAttribute('aria-pressed', String(o));
  $('#btn-ocultar').title = o ? 'Mostrar valores' : 'Ocultar valores';
}

export function iniciarDemo() {
  const atual = store.get().config;
  const demo = dadosDemo(hojeISO());
  store.substituirTudo({ ...demo, config: { ...atual, ...demo.config } });
  navegar('painel');
  toast('Demonstração carregada. Explore à vontade!');
}

function iniciar() {
  montarMenu();
  aplicarTema();
  aplicarOcultar();
  instalarBaloes();

  store.assinar(() => { versaoDados++; aplicarOcultar(); render(); });
  window.addEventListener('hashchange', () => { render(); $('#conteudo').focus({ preventScroll: true }); window.scrollTo(0, 0); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);

  $('#btn-atualizar').addEventListener('click', () => atualizarCotacoes());
  $('#btn-ocultar').addEventListener('click', () => store.configurar({ ocultarValores: !store.get().config.ocultarValores }));
  $('#btn-tema').addEventListener('click', () => {
    store.configurar({ tema: temaEfetivo() === 'dark' ? 'light' : 'dark' });
    aplicarTema();
    render();
  });
  $('#btn-novo').addEventListener('click', () => escolherNovaOperacao(contexto()));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao="sair-demo"]');
    if (b) { store.apagarTudo(); store.configurar({ demo: false }); navegar('painel'); toast('Pronto! Agora cadastre a sua primeira compra.'); }
    if (e.target.closest('[data-acao="demo"]')) iniciarDemo();
    if (e.target.closest('[data-acao="novo"]')) escolherNovaOperacao(contexto());
  });

  render();

  // Atualiza sozinho ao abrir, se as cotações tiverem mais de 15 minutos
  const datas = Object.values(store.get().cotacoes).filter((c) => !c.manual).map((c) => c.atualizadoEm).sort();
  const ult = datas[datas.length - 1];
  if (!ult || Date.now() - new Date(ult).getTime() > 15 * 60000) atualizarCotacoes({ silencioso: true });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
