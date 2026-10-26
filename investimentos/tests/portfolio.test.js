import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processarLancamentos, montarCarteira, evolucaoMensal, deslocarMeses, mesesEntre } from '../js/core/portfolio.js';
import { sugerirClasse, normalizarTicker, tickerValido } from '../js/core/classes.js';
import { parseNumero, arred } from '../js/core/money.js';

const L = (o) => ({ id: Math.random().toString(36), taxas: 0, ...o });
const perto = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('preço médio inclui taxas e não muda na venda', () => {
  const { ativos, vendas } = processarLancamentos([
    L({ tipo: 'compra', ticker: 'PETR4', data: '2024-01-10', quantidade: 100, preco: 30, taxas: 5 }),
    L({ tipo: 'compra', ticker: 'PETR4', data: '2024-02-10', quantidade: 100, preco: 40, taxas: 5 }),
    L({ tipo: 'venda',  ticker: 'PETR4', data: '2024-03-10', quantidade: 50,  preco: 45, taxas: 2 }),
  ]);
  const a = ativos.get('PETR4');
  // PM = (3000+5+4000+5)/200 = 35,05
  perto(a.custo / a.quantidade, 35.05);
  assert.equal(a.quantidade, 150);
  // resultado = 50*45 - 2 - 50*35,05 = 2250 - 2 - 1752,5 = 495,5
  perto(vendas[0].resultado, 495.5);
  perto(a.lucroRealizado, 495.5);
});

test('zerar a posição zera custo e mantém lucro realizado', () => {
  const { ativos } = processarLancamentos([
    L({ tipo: 'compra', ticker: 'VALE3', data: '2024-01-01', quantidade: 10, preco: 70 }),
    L({ tipo: 'venda',  ticker: 'VALE3', data: '2024-02-01', quantidade: 10, preco: 60 }),
  ]);
  const a = ativos.get('VALE3');
  assert.equal(a.quantidade, 0);
  assert.equal(a.custo, 0);
  perto(a.lucroRealizado, -100);
});

test('desdobramento multiplica quantidade e mantém custo', () => {
  const { ativos } = processarLancamentos([
    L({ tipo: 'compra', ticker: 'WEGE3', data: '2024-01-01', quantidade: 100, preco: 40 }),
    L({ tipo: 'desdobramento', ticker: 'WEGE3', data: '2024-05-01', fator: 2 }),
  ]);
  const a = ativos.get('WEGE3');
  assert.equal(a.quantidade, 200);
  perto(a.custo / a.quantidade, 20);
});

test('bonificação soma quantidade com custo atribuído', () => {
  const { ativos } = processarLancamentos([
    L({ tipo: 'compra', ticker: 'ITSA4', data: '2024-01-01', quantidade: 100, preco: 10 }),
    L({ tipo: 'bonificacao', ticker: 'ITSA4', data: '2024-06-01', quantidade: 10, preco: 5 }),
  ]);
  const a = ativos.get('ITSA4');
  assert.equal(a.quantidade, 110);
  perto(a.custo, 1050);
});

test('venda acima da posição gera aviso', () => {
  const { avisos } = processarLancamentos([
    L({ tipo: 'compra', ticker: 'BBAS3', data: '2024-01-01', quantidade: 10, preco: 25 }),
    L({ tipo: 'venda',  ticker: 'BBAS3', data: '2024-01-02', quantidade: 20, preco: 26 }),
  ]);
  assert.equal(avisos.length, 1);
});

test('lançamentos fora de ordem são ordenados por data', () => {
  const { ativos, avisos } = processarLancamentos([
    L({ tipo: 'venda',  ticker: 'ABEV3', data: '2024-02-01', quantidade: 10, preco: 15 }),
    L({ tipo: 'compra', ticker: 'ABEV3', data: '2024-01-01', quantidade: 10, preco: 12 }),
  ]);
  assert.equal(avisos.length, 0);
  perto(ativos.get('ABEV3').lucroRealizado, 30);
});

test('compra e venda no mesmo dia é marcada como day trade', () => {
  const { vendas } = processarLancamentos([
    L({ tipo: 'compra', ticker: 'MGLU3', data: '2024-01-01', quantidade: 10, preco: 10 }),
    L({ tipo: 'venda',  ticker: 'MGLU3', data: '2024-01-01', quantidade: 10, preco: 11 }),
  ]);
  assert.equal(vendas[0].dayTrade, true);
});

test('carteira consolida cotação, proventos, pesos e resultado total', () => {
  const c = montarCarteira({
    hoje: '2024-12-31',
    lancamentos: [
      L({ tipo: 'compra', ticker: 'TAEE11', data: '2024-01-01', quantidade: 100, preco: 35 }),
      L({ tipo: 'compra', ticker: 'MXRF11', data: '2024-01-01', quantidade: 100, preco: 10 }),
    ],
    proventos: [
      { ticker: 'TAEE11', data: '2024-06-01', valor: 200, tipo: 'dividendo' },
      { ticker: 'MXRF11', data: '2022-06-01', valor: 50, tipo: 'rendimento' }, // fora dos 12m
    ],
    cotacoes: { TAEE11: { preco: 40, variacaoDia: 0.01 } },
  });
  const taee = c.posicoes.find((p) => p.ticker === 'TAEE11');
  const mxrf = c.posicoes.find((p) => p.ticker === 'MXRF11');
  assert.equal(taee.classe, 'acao'); // unit, não FII
  assert.equal(mxrf.classe, 'fii');
  perto(taee.resultadoAberto, 500);
  perto(taee.resultadoTotal, 700);
  perto(taee.yieldOnCost, 200 / 3500);
  assert.equal(mxrf.temCotacao, false); // sem cotação: usa PM, resultado 0
  perto(mxrf.resultadoAberto, 0);
  perto(c.resumo.patrimonio, 5000);
  perto(taee.peso + mxrf.peso, 1);
  assert.equal(c.resumo.semCotacao, 1);
  assert.equal(c.resumo.ganhando, 1);
  perto(c.resumo.proventos12m, 200);
});

test('evolução mensal acompanha o custo aplicado', () => {
  const ev = evolucaoMensal([
    L({ tipo: 'compra', ticker: 'PETR4', data: '2024-01-15', quantidade: 10, preco: 30 }),
    L({ tipo: 'compra', ticker: 'PETR4', data: '2024-03-15', quantidade: 10, preco: 40 }),
  ], [{ ticker: 'PETR4', data: '2024-02-20', valor: 12 }], '2024-03-31');
  assert.deepEqual(ev.map((e) => e.custo), [300, 300, 700]);
  assert.deepEqual(ev.map((e) => e.proventos), [0, 12, 0]);
});

test('utilitários de datas', () => {
  assert.equal(deslocarMeses('2024-03-31', -1), '2024-02-29');
  assert.equal(deslocarMeses('2024-01-15', -12), '2023-01-15');
  assert.deepEqual(mesesEntre('2023-11-05', '2024-02-01'), ['2023-11', '2023-12', '2024-01', '2024-02']);
});

test('classificação automática de tickers', () => {
  assert.equal(sugerirClasse('PETR4'), 'acao');
  assert.equal(sugerirClasse('HGLG11'), 'fii');
  assert.equal(sugerirClasse('BOVA11'), 'etf');
  assert.equal(sugerirClasse('AAPL34'), 'bdr');
  assert.equal(sugerirClasse('KLBN11'), 'acao');
  assert.equal(normalizarTicker(' petr4f '), 'PETR4');
  assert.ok(tickerValido('BOVA11'));
  assert.ok(!tickerValido('PETR'));
});

test('parse de números no formato brasileiro', () => {
  assert.equal(parseNumero('1.234,56'), 1234.56);
  assert.equal(parseNumero('R$ 12,3'), 12.3);
  assert.equal(parseNumero('1234.5'), 1234.5);
  assert.ok(Number.isNaN(parseNumero('')));
  assert.equal(arred(1.005), 1.01);
});
