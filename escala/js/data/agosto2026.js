// ============================================================================
//  Escala de AGOSTO / 2026 — transcrita da escala oficial da CSCB (a foto).
//  Fonte única de verdade da demonstração: usada pela camada MOCK (offline) e
//  base do seed SQL (supabase/seed_agosto_2026.sql).
//
//  status: 'confirmada' | 'sem_grupo' | 'inversao' | 'substituicao' | 'solenidade'
//    (espelha a legenda de cores da escala em PDF)
//  Missas: 12:00 e 19:00. Domingo tem apenas 19:00.
// ============================================================================

export const ANO = 2026;
export const MES = 8; // Agosto

// Cada item: [dia, horario, grupo, status?]
const ITENS = [
  // 1ª semana
  [1, '12:00', 'Cânticos de Maria', 'substituicao'],
  [1, '19:00', 'Marquinhos'],
  [2, '19:00', 'Juliana e George'],
  [3, '12:00', 'Isaac'],
  [3, '19:00', 'Rayan'],
  [4, '12:00', 'PH e Aline', 'substituicao'],
  [4, '19:00', 'Cânticos de Maria'],
  [5, '12:00', 'Marcílio e Will', 'substituicao'],
  [5, '19:00', 'Mota Filho'],
  [6, '12:00', 'Levi'],
  [6, '19:00', 'Nildeno'],
  [7, '12:00', 'Saulo e PH', 'substituicao'],
  [7, '19:00', 'Marjorie'],

  // 2ª semana
  [8, '12:00', 'Damília'],
  [8, '19:00', 'Célio Costa'],
  [9, '19:00', 'Banda Consagração'],
  [10, '12:00', 'Isaac'],
  [10, '19:00', 'Matheus e Felipe'],
  [11, '12:00', 'Danilo e Aline'],
  [11, '19:00', 'Cânticos de Maria', 'substituicao'],
  [12, '12:00', 'Aninha/Cristóvão'],
  [12, '19:00', 'Marcos Lessa'],
  [13, '12:00', 'Levi'],
  [13, '19:00', 'Gustavo e Germana'],
  [14, '12:00', 'Léo Oliveira'],
  [14, '19:00', 'Banda Consagração', 'inversao'],

  // 3ª semana
  [15, '12:00', 'Marjorie', 'inversao'],
  [15, '19:00', 'Banda Consagração', 'inversao'],
  [16, '19:00', 'Marjorie'],
  [17, '12:00', 'Isaac'],
  [17, '19:00', 'AK Acústico'],
  [18, '12:00', 'Danilo e Aline'],
  [18, '19:00', 'Cânticos de Maria'],
  [19, '12:00', 'Aninha/Cristóvão'],
  [19, '19:00', 'Nildeno', 'substituicao'],
  [20, '12:00', 'Levi'],
  [20, '19:00', 'Nildeno'],
  [21, '12:00', 'Marcelo Braga'],
  [21, '19:00', 'PH e Luis', 'inversao'],

  // 4ª semana
  [22, '12:00', 'Nayara'],
  [22, '19:00', 'Lucas e Eglantine'],
  [23, '19:00', 'Luz de Maria'],
  [24, '12:00', 'Isaac'],
  [24, '19:00', 'Matheus e Felipe'],
  [25, '12:00', 'Danilo e Aline'],
  [25, '19:00', 'Maju'],
  [26, '12:00', 'Aninha/Cristóvão'],
  [26, '19:00', 'Marcos Lessa'],
  [27, '12:00', 'Levi'],
  [27, '19:00', 'Rennan e Filipe'],
  [28, '12:00', 'Léo Oliveira'],
  [28, '19:00', 'PH e Luis'],

  // 5ª semana
  [29, '12:00', 'Léo Deodato'],
  [29, '19:00', 'Taís Cavalcante', 'inversao'],
  [30, '19:00', 'Isaac'],
  [31, '12:00', 'Isaac'],
  [31, '19:00', 'Célio Costa'],
];

function iso(dia) {
  return `${ANO}-${String(MES).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export const escalaAgosto2026 = ITENS.map(([dia, horario, grupo, status]) => ({
  data: iso(dia),
  horario,
  grupo,
  status: status || 'confirmada',
  observacao: null,
}));

// Lista única de "grupos" (unidades escaladas) que aparecem na escala.
export const gruposAgosto2026 = [...new Set(ITENS.map((i) => i[2]))].sort((a, b) =>
  a.localeCompare(b, 'pt-BR')
);
