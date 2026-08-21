// ============================================================================
//  Configuração central do aplicativo.
//  Enquanto SUPABASE_URL/ANON_KEY estiverem vazios, o app roda em MODO DEMO
//  (offline, dados no navegador) — já populado com a escala de Agosto/2026.
//  Preencha os dois para conectar ao Supabase real (veja README.md).
// ============================================================================

export const CONFIG = {
  // --- Backend (deixe vazio para MODO DEMO) --------------------------------
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // Chave pública VAPID para Web Push (gere com `npx web-push generate-vapid-keys`).
  VAPID_PUBLIC_KEY: '',

  // --- Identidade ----------------------------------------------------------
  ADMIN_EMAIL: 'nildeno.aragao@gmail.com',
  IGREJA: 'Capela São Carlos Borromeu',
  PASTORAL: 'Pastoral da Música',
  PAROQUIA: 'Paróquia N. Sra. da Glória',
  SIGLA: 'CSCB',

  // --- Horários dos avisos (referência; o agendamento real está em cron.sql)
  AVISOS: {
    semana: 'Segunda, 08:00 — a todos os escalados da semana',
    dia_manha: '08:00 — quem toca na missa das 12h',
    dia_tarde: '15:00 — quem toca na missa das 19h',
  },
};

// Metadados de status — espelham a legenda de cores da escala oficial.
export const STATUS = {
  confirmada:   { label: 'Confirmada',            curta: 'OK',           cor: 'var(--st-ok)',    legenda: null },
  sem_grupo:    { label: 'Escala sem Grupo',      curta: 'Sem grupo',    cor: 'var(--st-red)',   legenda: 'Escala sem Grupo' },
  inversao:     { label: 'Inversão de Escala',    curta: 'Inversão',     cor: 'var(--st-green)', legenda: 'Substituição por Inversão de Escala' },
  substituicao: { label: 'Substituição',          curta: 'Substituição', cor: 'var(--st-blue)',  legenda: 'Substituição' },
  solenidade:   { label: 'Solenidade',            curta: 'Solenidade',   cor: 'var(--st-orange)',legenda: 'Escala Específica devido a Solenidades' },
};

export const STATUS_LEGENDA = ['sem_grupo', 'inversao', 'substituicao', 'solenidade'];

export function modoDemo() {
  return !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY;
}
