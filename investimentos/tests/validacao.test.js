import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarLancamento, validarProvento, lerCSVLancamentos, validarBackup, dataValida } from '../js/core/validacao.js';
import { sugerirClasse } from '../js/core/classes.js';

const HOJE = '2026-10-26';

test('lançamento válido é normalizado', () => {
  const r = validarLancamento({ tipo: 'compra', ticker: ' petr4 ', classe: 'acao', data: '2025-01-10', quantidade: '100', preco: '30,50', taxas: '' }, HOJE);
  assert.ok(r.ok);
  assert.equal(r.valor.ticker, 'PETR4');
  assert.equal(r.valor.preco, 30.5);
  assert.equal(r.valor.taxas, 0);
});

test('lançamento inválido lista os erros', () => {
  const r = validarLancamento({ tipo: 'compra', ticker: 'XX', classe: 'acao', data: '2030-01-01', quantidade: '0', preco: '-1' }, HOJE);
  assert.equal(r.ok, false);
  assert.equal(r.erros.length, 4);
});

test('desdobramento exige fator diferente de 1', () => {
  assert.equal(validarLancamento({ tipo: 'desdobramento', ticker: 'WEGE3', classe: 'acao', data: '2025-01-01', fator: '1' }, HOJE).ok, false);
  assert.equal(validarLancamento({ tipo: 'desdobramento', ticker: 'WEGE3', classe: 'acao', data: '2025-01-01', fator: '0,1' }, HOJE).ok, true);
});

test('provento valida valor e data', () => {
  assert.ok(validarProvento({ tipo: 'jcp', ticker: 'ITSA4', data: '2025-05-01', valor: '12,30' }, HOJE).ok);
  assert.equal(validarProvento({ tipo: 'jcp', ticker: 'ITSA4', data: '2025-02-30', valor: '0' }, HOJE).erros.length, 2);
});

test('datas inexistentes são rejeitadas', () => {
  assert.ok(dataValida('2024-02-29'));
  assert.ok(!dataValida('2023-02-29'));
});

test('CSV com datas brasileiras, C/V e linha com erro', () => {
  const csv = '﻿Data;Tipo;Ticker;Quantidade;Preço;Taxas\n15/01/2025;C;PETR4;100;35,50;2,40\n20/03/2025;v;HGLG11;5;160;0\n01/01/2025;compra;PETR;1;1;0\n';
  const { validos, erros } = lerCSVLancamentos(csv, sugerirClasse);
  assert.equal(validos.length, 2);
  assert.equal(validos[0].data, '2025-01-15');
  assert.equal(validos[1].tipo, 'venda');
  assert.equal(validos[1].classe, 'fii');
  assert.equal(erros.length, 1);
});

test('backup de outro app é recusado', () => {
  assert.ok(validarBackup({ app: 'outro' }));
  assert.equal(validarBackup({ app: 'carteira-investimentos', dados: { lancamentos: [], proventos: [] } }), null);
});
