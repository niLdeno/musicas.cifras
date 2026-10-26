import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  curvaDeTaxasDiarias, curvaDeTaxasMensais, curvaDeNiveis, nivelEm,
  fluxosDaCarteira, simular, tir, comparar,
} from '../js/core/benchmark.js';

const perto = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('CDI diário: aplica a taxa do dia e trata fim de semana como degrau', () => {
  // sexta 1%, segunda 1%
  const c = curvaDeTaxasDiarias([['2025-01-03', 1], ['2025-01-06', 1]]);
  perto(nivelEm(c, '2025-01-03'), 1);
  perto(nivelEm(c, '2025-01-04'), 1.01); // sábado = nível de segunda (antes de render segunda)
  perto(nivelEm(c, '2025-01-06'), 1.01);
  perto(nivelEm(c, '2025-01-07'), 1.0201);
  perto(nivelEm(c, '2025-02-01'), 1.0201); // após o último dado, fica parado
  assert.equal(nivelEm(c, '2025-01-01'), null);
});

test('IPCA mensal: distribui no mês e estima meses ainda não divulgados', () => {
  const c = curvaDeTaxasMensais([['2025-01', 1], ['2025-02', 2]], '2025-04-15');
  perto(nivelEm(c, '2025-02-01'), 1.01);
  perto(nivelEm(c, '2025-03-01'), 1.0302);
  perto(nivelEm(c, '2025-04-01'), 1.0302 * 1.02); // março estimado = repete 2%
  assert.equal(c.estimadoDesde, '2025-03');
  // meio de janeiro: ~metade do mês, crescimento geométrico
  const meio = nivelEm(c, '2025-01-16');
  assert.ok(meio > 1.004 && meio < 1.006);
});

test('Ibovespa: interpola entre fechamentos', () => {
  const c = curvaDeNiveis([['2025-01-01', 100], ['2025-01-11', 121]]);
  perto(nivelEm(c, '2025-01-06'), 110, 1e-9); // geométrico: 100 × 1,1
});

test('simulação usa os mesmos aportes nas mesmas datas', () => {
  // 10% ao mês "fictício": R$ 1.000 em jan e R$ 500 em fev
  const c = curvaDeNiveis([['2025-01-01', 1], ['2025-02-01', 1.1], ['2025-03-01', 1.21]]);
  const fluxos = [{ data: '2025-01-01', valor: 1000 }, { data: '2025-02-01', valor: 500 }];
  perto(simular(fluxos, c, '2025-03-01'), 1000 * 1.21 + 500 * 1.1);
  // resgate reduz o saldo
  perto(simular([...fluxos, { data: '2025-03-01', valor: -100 }], c, '2025-03-01'), 1210 + 550 - 100);
  assert.equal(simular([{ data: '2024-12-01', valor: 1 }], c, '2025-03-01'), null);
});

test('fluxos: compra é aporte, venda e provento são resgates', () => {
  const f = fluxosDaCarteira([
    { tipo: 'compra', data: '2025-01-01', quantidade: 10, preco: 10, taxas: 1 },
    { tipo: 'venda', data: '2025-03-01', quantidade: 5, preco: 12, taxas: 1 },
    { tipo: 'desdobramento', data: '2025-04-01', fator: 2 },
  ], [{ data: '2025-02-01', valor: 3 }]);
  assert.deepEqual(f.map((x) => x.valor), [101, -3, -59]);
});

test('TIR: 10% ao ano em um ano', () => {
  perto(tir([{ data: '2025-01-01', valor: -1000 }, { data: '2026-01-01', valor: 1100 }]), 0.1, 1e-6);
  assert.equal(tir([{ data: '2025-01-01', valor: -1000 }]), null);
});

test('TIR considera o momento de cada aporte', () => {
  // o exemplo do usuário: 1000 + 500 + 500 viram 2300
  const t = tir([
    { data: '2025-01-01', valor: -1000 }, { data: '2025-02-01', valor: -500 },
    { data: '2025-04-01', valor: -500 }, { data: '2026-01-01', valor: 2300 },
  ]);
  // 300/2000 = 15%, mas parte do dinheiro ficou menos tempo → taxa anual maior que 15%
  assert.ok(t > 0.15 && t < 0.25, String(t));
});

test('comparar: ganho, diferença, ganho real e % do CDI', () => {
  const linear = (taxaAno) => curvaDeNiveis([['2025-01-01', 1], ['2026-01-01', 1 + taxaAno]]);
  const r = comparar({
    fluxos: [{ data: '2025-01-01', valor: 2000 }],
    patrimonio: 2300,
    hoje: '2026-01-01',
    curvas: { cdi: linear(0.1), ipca: linear(0.05), ibov: curvaDeNiveis([['2025-06-01', 1]]) },
  });
  perto(r.carteira.ganho, 300);
  perto(r.refs.cdi.ganho, 200);
  perto(r.refs.cdi.diferenca, 100);
  perto(r.refs.cdi.percentualDoGanho, 1.5);
  perto(r.ganhoReal, 200);
  perto(r.carteira.tir, 0.15, 1e-6);
  assert.equal(r.refs.ibov.indisponivel, true); // histórico começa depois do 1º aporte
});
