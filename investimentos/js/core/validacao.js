// ============================================================================
//  Validação de dados de entrada (formulários, importação de backup e CSV).
//  Cada função devolve { ok, erros[], valor } — o valor já normalizado.
// ============================================================================
import { normalizarTicker, tickerValido, CLASSES } from './classes.js';
import { TIPOS_LANCAMENTO, TIPOS_PROVENTO } from './portfolio.js';
import { parseNumero } from './money.js';

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

export function dataValida(s) {
  if (!DATA_RE.test(s || '')) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validarLancamento(entrada, hoje = new Date().toISOString().slice(0, 10)) {
  const erros = [];
  const v = {
    id: entrada.id,
    tipo: entrada.tipo,
    ticker: normalizarTicker(entrada.ticker),
    classe: entrada.classe,
    data: entrada.data,
    quantidade: parseNumero(entrada.quantidade),
    preco: parseNumero(entrada.preco),
    taxas: entrada.taxas === '' || entrada.taxas == null ? 0 : parseNumero(entrada.taxas),
    fator: parseNumero(entrada.fator),
    nota: String(entrada.nota || '').slice(0, 200),
    criadoEm: entrada.criadoEm,
  };

  if (!TIPOS_LANCAMENTO[v.tipo]) erros.push('Escolha o tipo de operação.');
  if (!tickerValido(v.ticker)) erros.push('Código do ativo inválido (ex.: PETR4, HGLG11).');
  if (!CLASSES[v.classe]) erros.push('Escolha a classe do ativo.');
  if (!dataValida(v.data)) erros.push('Data inválida.');
  else if (v.data > hoje) erros.push('A data não pode estar no futuro.');

  if (v.tipo === 'desdobramento') {
    if (!(v.fator > 0) || v.fator === 1) erros.push('Informe o fator (ex.: 2 para desdobramento 1→2, 0,1 para grupamento 10→1).');
    v.quantidade = 0; v.preco = 0; v.taxas = 0;
  } else {
    delete v.fator;
    if (!(v.quantidade > 0)) erros.push('A quantidade deve ser maior que zero.');
    if (v.tipo === 'bonificacao') {
      if (!(v.preco >= 0)) erros.push('Informe o custo atribuído por ação (pode ser 0).');
    } else if (!(v.preco > 0)) erros.push('O preço deve ser maior que zero.');
    if (!(v.taxas >= 0)) erros.push('As taxas não podem ser negativas.');
  }
  return { ok: erros.length === 0, erros, valor: v };
}

export function validarProvento(entrada, hoje = new Date().toISOString().slice(0, 10)) {
  const erros = [];
  const v = {
    id: entrada.id,
    tipo: entrada.tipo,
    ticker: normalizarTicker(entrada.ticker),
    data: entrada.data,
    valor: parseNumero(entrada.valor),
    nota: String(entrada.nota || '').slice(0, 200),
    criadoEm: entrada.criadoEm,
  };
  if (!TIPOS_PROVENTO[v.tipo]) erros.push('Escolha o tipo de provento.');
  if (!tickerValido(v.ticker)) erros.push('Código do ativo inválido.');
  if (!dataValida(v.data)) erros.push('Data inválida.');
  else if (v.data > hoje) erros.push('A data não pode estar no futuro.');
  if (!(v.valor > 0)) erros.push('O valor deve ser maior que zero.');
  return { ok: erros.length === 0, erros, valor: v };
}

/**
 * Lê um CSV simples (separador ; ou ,) com cabeçalho:
 *   data;tipo;ticker;quantidade;preco;taxas[;classe]
 * Datas em DD/MM/AAAA ou AAAA-MM-DD. Tipos: compra/venda (ou C/V).
 */
export function lerCSVLancamentos(texto, classeDe) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return { validos: [], erros: ['O arquivo está vazio ou sem cabeçalho.'] };
  const sep = linhas[0].includes(';') ? ';' : ',';
  const cab = linhas[0].split(sep).map((c) => c.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const idx = (n) => cab.indexOf(n);
  const faltando = ['data', 'tipo', 'ticker', 'quantidade', 'preco'].filter((n) => idx(n) < 0);
  if (faltando.length) return { validos: [], erros: [`Colunas obrigatórias ausentes: ${faltando.join(', ')}.`] };

  const validos = [];
  const erros = [];
  linhas.slice(1).forEach((linha, i) => {
    const c = linha.split(sep).map((x) => x.trim());
    let data = c[idx('data')] || '';
    const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) data = `${br[3]}-${br[2]}-${br[1]}`;
    let tipo = (c[idx('tipo')] || '').toLowerCase();
    if (tipo === 'c') tipo = 'compra';
    if (tipo === 'v') tipo = 'venda';
    const ticker = normalizarTicker(c[idx('ticker')]);
    const r = validarLancamento({
      tipo, data, ticker,
      quantidade: c[idx('quantidade')],
      preco: c[idx('preco')],
      taxas: idx('taxas') >= 0 ? c[idx('taxas')] : 0,
      classe: (idx('classe') >= 0 && CLASSES[c[idx('classe')]?.toLowerCase()]) ? c[idx('classe')].toLowerCase() : classeDe(ticker),
    });
    if (r.ok) validos.push(r.valor);
    else erros.push(`Linha ${i + 2}: ${r.erros.join(' ')}`);
  });
  return { validos, erros };
}

/** Confere a estrutura de um backup antes de substituir os dados. */
export function validarBackup(obj) {
  if (!obj || typeof obj !== 'object') return 'Arquivo inválido.';
  if (obj.app !== 'carteira-investimentos') return 'Este arquivo não é um backup deste aplicativo.';
  if (!Array.isArray(obj.dados?.lancamentos) || !Array.isArray(obj.dados?.proventos)) return 'Backup incompleto: faltam lançamentos ou proventos.';
  for (const l of obj.dados.lancamentos) if (!validarLancamento(l, '9999-12-31').ok) return `Lançamento inválido no backup (${l.ticker} ${l.data}).`;
  for (const p of obj.dados.proventos) if (!validarProvento(p, '9999-12-31').ok) return `Provento inválido no backup (${p.ticker} ${p.data}).`;
  return null;
}
