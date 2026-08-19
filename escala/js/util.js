// ============================================================================
//  Utilitários: datas (fuso local, sem surpresas de UTC), grade semanal,
//  helpers de DOM e formatação. Sem dependências externas.
// ============================================================================

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

// Colunas da grade, na MESMA ordem da escala oficial (começa no sábado).
export const DIAS_SEMANA = [
  'sábado', 'domingo', 'segunda-feira', 'terça-feira',
  'quarta-feira', 'quinta-feira', 'sexta-feira',
];
export const DIAS_CURTOS = ['Sáb', 'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

// Horários de missa por dia da semana. Domingo (getDay()===0) só tem 19h.
export function horariosDoDia(date) {
  return date.getDay() === 0 ? ['19:00'] : ['12:00', '19:00'];
}

// Índice de coluna na grade (sábado = 0 ... sexta = 6).
export function colunaGrade(date) {
  return (date.getDay() + 1) % 7;
}

// Converte 'YYYY-MM-DD' em Date LOCAL (evita o -1 dia do fuso UTC).
export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function mesmaData(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Constrói as semanas do mês, quebrando a cada sábado — como na escala oficial.
// Retorna: [{ semana: 1, dias: [{date, iso, coluna, horarios}, ...] }, ...]
export function semanasDoMes(ano, mes /* 1-12 */) {
  const totalDias = new Date(ano, mes, 0).getDate();
  const semanas = [];
  let atual = null;
  for (let dia = 1; dia <= totalDias; dia++) {
    const date = new Date(ano, mes - 1, dia);
    const coluna = colunaGrade(date);
    if (coluna === 0 || atual === null) {
      atual = { semana: semanas.length + 1, dias: [] };
      semanas.push(atual);
    }
    atual.dias.push({ date, iso: toISO(date), coluna, horarios: horariosDoDia(date) });
  }
  return semanas;
}

export function nomeMes(mes /* 1-12 */) {
  return MESES[mes - 1];
}

export function capitalizar(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Chave ISO de semana (ano-Www) para idempotência dos avisos semanais.
export function chaveSemanaISO(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ---- DOM helpers ----------------------------------------------------------
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

// ID curto legível (para o mock).
export function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
