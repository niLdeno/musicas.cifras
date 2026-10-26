import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apurarIR, vencimentoDarf } from '../js/core/tax.js';

const V = (o) => ({ dayTrade: false, ...o });

test('ações: vendas até R$ 20 mil no mês são isentas', () => {
  const [m] = apurarIR([V({ data: '2024-03-10', classe: 'acao', valorVenda: 19000, resultado: 3000 })]);
  assert.equal(m.isento, true);
  assert.equal(m.lucroIsento, 3000);
  assert.equal(m.darf, 0);
});

test('ações: vendas acima de R$ 20 mil pagam 15%', () => {
  const [m] = apurarIR([V({ data: '2024-03-10', classe: 'acao', valorVenda: 25000, resultado: 4000 })]);
  assert.equal(m.isento, false);
  assert.equal(m.impostoComum, 600);
  assert.equal(m.pagar, true);
  assert.equal(m.vencimento, '2024-04-30');
});

test('prejuízo é compensado em meses seguintes (mesmo em mês isento ele acumula)', () => {
  const meses = apurarIR([
    V({ data: '2024-01-10', classe: 'acao', valorVenda: 5000, resultado: -1000 }),  // isento, mas prejuízo conta
    V({ data: '2024-02-10', classe: 'acao', valorVenda: 30000, resultado: 3000 }),
  ]);
  assert.equal(meses[0].prejuizoComumAcumulado, 1000);
  assert.equal(meses[1].compensadoComum, 1000);
  assert.equal(meses[1].impostoComum, 300);
  assert.equal(meses[1].prejuizoComumAcumulado, 0);
});

test('FII: 20% sem isenção e prejuízo separado das ações', () => {
  const meses = apurarIR([
    V({ data: '2024-01-10', classe: 'acao', valorVenda: 30000, resultado: -2000 }),
    V({ data: '2024-02-10', classe: 'fii', valorVenda: 1000, resultado: 500 }),
  ]);
  assert.equal(meses[1].impostoFii, 100);
  assert.equal(meses[1].compensadoFii, 0);
  assert.equal(meses[1].prejuizoComumAcumulado, 2000);
});

test('ETF e BDR não têm isenção', () => {
  const [m] = apurarIR([V({ data: '2024-05-02', classe: 'etf', valorVenda: 3000, resultado: 400 })]);
  assert.equal(m.impostoComum, 60);
});

test('DARF menor que R$ 10 acumula para o próximo mês', () => {
  const meses = apurarIR([
    V({ data: '2024-01-10', classe: 'fii', valorVenda: 200, resultado: 30 }),   // 6,00
    V({ data: '2024-03-10', classe: 'fii', valorVenda: 200, resultado: 25 }),   // 5,00 + 6,00
  ]);
  assert.equal(meses[0].pagar, false);
  assert.equal(meses[1].darf, 11);
  assert.equal(meses[1].pagar, true);
});

test('day trade fica fora da apuração comum', () => {
  const [m] = apurarIR([V({ data: '2024-01-10', classe: 'acao', valorVenda: 50000, resultado: 1000, dayTrade: true })]);
  assert.equal(m.dayTrades, 1);
  assert.equal(m.darf, 0);
});

test('vencimento cai no último dia útil do mês seguinte', () => {
  assert.equal(vencimentoDarf('2024-07'), '2024-08-30'); // 31/08/2024 é sábado
  assert.equal(vencimentoDarf('2024-12'), '2025-01-31');
});
