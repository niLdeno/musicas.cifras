// ============================================================================
//  Gráficos (Chart.js 4). Cores lidas dos tokens CSS, então tema claro/escuro
//  e paleta ficam num único lugar (css/styles.css). Regras seguidas:
//  1 eixo só, cores fixas por entidade (classe sempre com a mesma cor),
//  legenda + tooltip, marcas finas e grade discreta.
// ============================================================================
import { brl, pct, compacto, brlSinal } from '../core/money.js';

const instancias = new Map();

const tok = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
export const corSerie = (i) => tok(`--serie-${i}`);
export const COR_CLASSE = { acao: 1, fii: 2, etf: 3, bdr: 4 };

const oculto = () => document.body.classList.contains('ocultar');
const fmtValor = (v) => (oculto() ? '••••' : brl(v));

function base() {
  const Chart = window.Chart;
  Chart.defaults.font.family = tok('--fonte');
  Chart.defaults.font.size = 12;
  Chart.defaults.color = tok('--tinta-2');
  Chart.defaults.borderColor = tok('--grade');
  return Chart;
}

function criar(canvas, config) {
  if (!window.Chart || !canvas) return null;
  instancias.get(canvas)?.destroy();
  const Chart = base();
  const ch = new Chart(canvas, config);
  instancias.set(canvas, ch);
  return ch;
}

/** Destrói gráficos cujo canvas saiu da tela (troca de rota). */
export function limparGraficos() {
  for (const [canvas, ch] of instancias) {
    if (!canvas.isConnected) { ch.destroy(); instancias.delete(canvas); }
  }
}

const tooltipBase = () => ({
  backgroundColor: tok('--superficie-alta'),
  titleColor: tok('--tinta'),
  bodyColor: tok('--tinta-2'),
  borderColor: tok('--borda'),
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  boxPadding: 4,
  usePointStyle: true,
});

const eixoValor = (extra = {}) => ({
  grid: { color: tok('--grade'), drawTicks: false },
  border: { display: false },
  ticks: { padding: 8, callback: (v) => (oculto() ? '' : compacto(v)), maxTicksLimit: 6 },
  ...extra,
});
const eixoCategoria = (extra = {}) => ({
  grid: { display: false },
  border: { color: tok('--eixo') },
  ticks: { padding: 6 },
  ...extra,
});

// ---------------------------------------------------------------------------
/** Rosca de alocação: [{ rotulo, valor, cor }] */
export function rosca(canvas, itens) {
  return criar(canvas, {
    type: 'doughnut',
    data: {
      labels: itens.map((i) => i.rotulo),
      datasets: [{
        data: itens.map((i) => i.valor),
        backgroundColor: itens.map((i) => i.cor),
        borderColor: tok('--superficie'),
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      cutout: '68%',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // legenda em HTML ao lado, com valores
        tooltip: {
          ...tooltipBase(),
          callbacks: {
            label: (c) => {
              const total = c.dataset.data.reduce((s, v) => s + v, 0);
              return ` ${c.label}: ${fmtValor(c.raw)} (${pct(total ? c.raw / total : 0)})`;
            },
          },
        },
      },
    },
  });
}

/** Barras horizontais de lucro/prejuízo por ativo: [{ rotulo, valor, pct }] */
export function barrasResultado(canvas, itens, { modo = 'brl' } = {}) {
  const ganho = tok('--ganho-viz');
  const perda = tok('--perda-viz');
  const valores = itens.map((i) => (modo === 'pct' ? i.pct * 100 : i.valor));
  return criar(canvas, {
    type: 'bar',
    data: {
      labels: itens.map((i) => i.rotulo),
      datasets: [{
        data: valores,
        backgroundColor: valores.map((v) => (v >= 0 ? ganho : perda)),
        borderRadius: 4,
        borderSkipped: 'start',
        barPercentage: 0.8,
        categoryPercentage: 0.9,
        maxBarThickness: 22,
      }],
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipBase(),
          callbacks: {
            label: (c) => {
              const it = itens[c.dataIndex];
              const pref = it.valor >= 0 ? '▲ Lucro' : '▼ Prejuízo';
              return ` ${pref}: ${oculto() ? '••••' : brlSinal(it.valor)} (${pct(it.pct)})`;
            },
          },
        },
      },
      scales: {
        x: modo === 'pct'
          ? eixoValor({ ticks: { padding: 8, callback: (v) => v + '%', maxTicksLimit: 6 } })
          : eixoValor(),
        y: eixoCategoria({ grid: { display: false }, border: { display: false }, ticks: { font: { weight: 600 } } }),
      },
    },
  });
}

/** Linhas de evolução: séries = [{ rotulo, pontos:[{x,y}], cor, area? }] */
export function linhas(canvas, rotulos, series) {
  return criar(canvas, {
    type: 'line',
    data: {
      labels: rotulos,
      datasets: series.map((s) => ({
        label: s.rotulo,
        data: s.valores,
        borderColor: s.cor,
        backgroundColor: s.area ? s.cor + '1f' : s.cor,
        fill: !!s.area,
        borderWidth: s.espessa ? 3 : 2,
        pointRadius: 0,
        spanGaps: true,
        pointHoverRadius: 5,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: tok('--superficie'),
        tension: 0.25,
        stepped: s.degrau ? 'after' : false,
      })),
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'start', labels: { usePointStyle: true, pointStyle: 'line', boxWidth: 18, padding: 14 } },
        tooltip: { ...tooltipBase(), callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtValor(c.raw)}` } },
      },
      scales: { x: eixoCategoria({ ticks: { maxTicksLimit: 8, maxRotation: 0 } }), y: eixoValor() },
    },
  });
}

/** Barras verticais empilhadas (proventos por mês e por tipo). */
export function barrasEmpilhadas(canvas, rotulos, series) {
  return criar(canvas, {
    type: 'bar',
    data: {
      labels: rotulos,
      datasets: series.map((s) => ({
        label: s.rotulo,
        data: s.valores,
        backgroundColor: s.cor,
        borderColor: tok('--superficie'),
        borderWidth: { top: 2 },
        borderRadius: 3,
        borderSkipped: false,
        maxBarThickness: 28,
      })),
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'start', labels: { usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, padding: 14 } },
        tooltip: {
          ...tooltipBase(),
          filter: (c) => c.raw > 0,
          callbacks: {
            label: (c) => ` ${c.dataset.label}: ${fmtValor(c.raw)}`,
            footer: (cs) => `Total: ${fmtValor(cs.reduce((s, c) => s + c.raw, 0))}`,
          },
        },
      },
      scales: {
        x: eixoCategoria({ stacked: true, ticks: { maxRotation: 0, autoSkipPadding: 8 } }),
        y: eixoValor({ stacked: true }),
      },
    },
  });
}
