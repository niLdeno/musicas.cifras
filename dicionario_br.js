const DICIONARIO_BRASIL = {
  // === FAMÍLIA DÓ (C) ===
  'C': [
    { posicoes: [-1, 3, 2, 0, 1, 0], dedos: [null, 3, 2, null, 1, null] },
    { posicoes: [-1, 3, 5, 5, 5, 3], dedos: [null, 1, 2, 3, 4, 1] }, // Pestana 3ª
    { posicoes: [8, 10, 10, 9, 8, 8], dedos: [1, 3, 4, 2, 1, 1] }    // Pestana 8ª
  ],
  'Cm': [
    { posicoes: [-1, 3, 5, 5, 4, 3], dedos: [null, 1, 3, 4, 2, 1] },
    { posicoes: [8, 10, 10, 8, 8, 8], dedos: [1, 3, 4, 1, 1, 1] }
  ],
  'C7': [{ posicoes: [-1, 3, 2, 3, 1, 0], dedos: [null, 3, 2, 4, 1, null] }],
  'C7M': [{ posicoes: [-1, 3, 2, 0, 0, 0], dedos: [null, 3, 2, null, null, null] }],
  'Cm7': [{ posicoes: [-1, 3, 5, 3, 4, 3], dedos: [null, 1, 3, 1, 2, 1] }],
  'C9': [{ posicoes: [-1, 3, 2, 3, 3, -1], dedos: [null, 2, 1, 3, 4, null] }],
  'Cdim': [{ posicoes: [-1, 3, 4, 2, 4, -1], dedos: [null, 2, 3, 1, 4, null] }],
  'Cm7(b5)': [{ posicoes: [-1, 3, 4, 3, 4, -1], dedos: [null, 1, 3, 2, 4, null] }],
  'Csus4': [{ posicoes: [-1, 3, 3, 0, 1, 0], dedos: [null, 3, 4, null, 1, null] }],

  // === FAMÍLIA DÓ SUSTENIDO (C#) ===
  'C#': [
    { posicoes: [-1, 4, 6, 6, 6, 4], dedos: [null, 1, 2, 3, 4, 1] },
    { posicoes: [9, 11, 11, 10, 9, 9], dedos: [1, 3, 4, 2, 1, 1] }
  ],
  'C#m': [
    { posicoes: [-1, 4, 6, 6, 5, 4], dedos: [null, 1, 3, 4, 2, 1] },
    { posicoes: [9, 11, 11, 9, 9, 9], dedos: [1, 3, 4, 1, 1, 1] }
  ],
  'C#7': [{ posicoes: [-1, 4, 6, 4, 6, 4], dedos: [null, 1, 3, 1, 4, 1] }],
  'C#7M': [{ posicoes: [-1, 4, 6, 5, 6, 4], dedos: [null, 1, 3, 2, 4, 1] }],
  'C#m7': [{ posicoes: [-1, 4, 6, 4, 5, 4], dedos: [null, 1, 3, 1, 2, 1] }],
  'C#9': [{ posicoes: [-1, 4, 3, 4, 4, -1], dedos: [null, 2, 1, 3, 4, null] }],
  'C#dim': [{ posicoes: [-1, 4, 5, 3, 5, -1], dedos: [null, 2, 3, 1, 4, null] }],
  'C#m7(b5)': [{ posicoes: [-1, 4, 5, 4, 5, -1], dedos: [null, 1, 3, 2, 4, null] }],
  'C#sus4': [{ posicoes: [-1, 4, 6, 6, 7, 4], dedos: [null, 1, 2, 3, 4, 1] }],

  // === FAMÍLIA RÉ (D) ===
  'D': [
    { posicoes: [-1, -1, 0, 2, 3, 2], dedos: [null, null, null, 1, 3, 2] },
    { posicoes: [-1, 5, 7, 7, 7, 5], dedos: [null, 1, 2, 3, 4, 1] },
    { posicoes: [10, 12, 12, 11, 10, 10], dedos: [1, 3, 4, 2, 1, 1] }
  ],
  'Dm': [
    { posicoes: [-1, -1, 0, 2, 3, 1], dedos: [null, null, null, 2, 3, 1] },
    { posicoes: [-1, 5, 7, 7, 6, 5], dedos: [null, 1, 3, 4, 2, 1] }
  ],
  'D7': [{ posicoes: [-1, -1, 0, 2, 1, 2], dedos: [null, null, null, 2, 1, 3] }],
  'D7M': [{ posicoes: [-1, -1, 0, 2, 2, 2], dedos: [null, null, null, 1, 2, 3] }],
  'Dm7': [{ posicoes: [-1, -1, 0, 2, 1, 1], dedos: [null, null, null, 2, 1, 1] }],
  'D9': [{ posicoes: [-1, 5, 4, 5, 5, -1], dedos: [null, 2, 1, 3, 4, null] }],
  'Ddim': [{ posicoes: [-1, -1, 0, 1, 0, 1], dedos: [null, null, null, 1, null, 2] }],
  'Dm7(b5)': [{ posicoes: [-1, -1, 0, 1, 1, 1], dedos: [null, null, null, 1, 2, 3] }],
  'Dsus4': [{ posicoes: [-1, -1, 0, 2, 3, 3], dedos: [null, null, null, 1, 3, 4] }],

  // === FAMÍLIA RÉ SUSTENIDO (D#) ===
  'D#': [
    { posicoes: [-1, -1, 1, 3, 4, 3], dedos: [null, null, 1, 2, 4, 3] },
    { posicoes: [-1, 6, 8, 8, 8, 6], dedos: [null, 1, 2, 3, 4, 1] }
  ],
  'D#m': [
    { posicoes: [-1, -1, 1, 3, 4, 2], dedos: [null, null, 1, 3, 4, 2] },
    { posicoes: [-1, 6, 8, 8, 7, 6], dedos: [null, 1, 3, 4, 2, 1] }
  ],
  'D#7': [{ posicoes: [-1, 6, 8, 6, 8, 6], dedos: [null, 1, 3, 1, 4, 1] }],
  'D#7M': [{ posicoes: [-1, 6, 8, 7, 8, 6], dedos: [null, 1, 3, 2, 4, 1] }],
  'D#m7': [{ posicoes: [-1, 6, 8, 6, 7, 6], dedos: [null, 1, 3, 1, 2, 1] }],
  'D#9': [{ posicoes: [-1, 6, 5, 6, 6, -1], dedos: [null, 2, 1, 3, 4, null] }],
  'D#dim': [{ posicoes: [-1, -1, 1, 2, 1, 2], dedos: [null, null, 1, 3, 2, 4] }],
  'D#m7(b5)': [{ posicoes: [-1, 6, 7, 6, 7, -1], dedos: [null, 1, 3, 2, 4, null] }],
  'D#sus4': [{ posicoes: [-1, 6, 8, 8, 9, 6], dedos: [null, 1, 2, 3, 4, 1] }],

  // === FAMÍLIA MI (E) ===
  'E': [
    { posicoes: [0, 2, 2, 1, 0, 0], dedos: [null, 2, 3, 1, null, null] },
    { posicoes: [-1, 7, 9, 9, 9, 7], dedos: [null, 1, 2, 3, 4, 1] }
  ],
  'Em': [
    { posicoes: [0, 2, 2, 0, 0, 0], dedos: [null, 2, 3, null, null, null] },
    { posicoes: [-1, 7, 9, 9, 8, 7], dedos: [null, 1, 3, 4, 2, 1] }
  ],
  'E7': [{ posicoes: [0, 2, 0, 1, 0, 0], dedos: [null, 2, null, 1, null, null] }],
  'E7M': [{ posicoes: [0, 2, 1, 1, 0, 0], dedos: [null, 3, 1, 2, null, null] }],
  'Em7': [{ posicoes: [0, 2, 2, 0, 3, 0], dedos: [null, 1, 2, null, 4, null] }],
  'E9': [{ posicoes: [0, 2, 0, 1, 0, 2], dedos: [null, 2, null, 1, null, 4] }],
  'Edim': [{ posicoes: [0, 1, 2, 0, 2, 0], dedos: [null, 1, 2, null, 3, null] }],
  'Em7(b5)': [{ posicoes: [0, 1, 0, 0, 3, 0], dedos: [null, 1, null, null, 4, null] }],
  'Esus4': [{ posicoes: [0, 2, 2, 2, 0, 0], dedos: [null, 2, 3, 4, null, null] }],

  // === FAMÍLIA FÁ (F) ===
  'F': [
    { posicoes: [1, 3, 3, 2, 1, 1], dedos: [1, 3, 4, 2, 1, 1] },
    { posicoes: [-1, 8, 10, 10, 10, 8], dedos: [null, 1, 2, 3, 4, 1] }
  ],
  'Fm': [
    { posicoes: [1, 3, 3, 1, 1, 1], dedos: [1, 3, 4, 1, 1, 1] },
    { posicoes: [-1, 8, 10, 10, 9, 8], dedos: [null, 1, 3, 4, 2, 1] }
  ],
  'F7': [{ posicoes: [1, 3, 1, 2, 1, 1], dedos: [1, 3, 1, 2, 1, 1] }],
  'F7M': [{ posicoes: [-1, -1, 3, 2, 1, 0], dedos: [null, null, 3, 2, 1, null] }],
  'Fm7': [{ posicoes: [1, 3, 1, 1, 1, 1], dedos: [1, 3, 1, 1, 1, 1] }],
  'F9': [{ posicoes: [1, 3, 1, 2, 1, 3], dedos: [1, 3, 1, 2, 1, 4] }],
  'Fdim': [{ posicoes: [-1, -1, 3, 4, 3, 4], dedos: [null, null, 1, 3, 2, 4] }],
  'Fm7(b5)': [{ posicoes: [1, 2, 1, 1, -1, -1], dedos: [1, 2, 1, 1, null, null] }],
  'Fsus4': [{ posicoes: [1, 3, 3, 3, 1, 1], dedos: [1, 2, 3, 4, 1, 1] }],

  // === FAMÍLIA FÁ SUSTENIDO (F#) ===
  'F#': [
    { posicoes: [2, 4, 4, 3, 2, 2], dedos: [1, 3, 4, 2, 1, 1] },
    { posicoes: [-1, 9, 11, 11, 11, 9], dedos: [null, 1, 2, 3, 4, 1] }
  ],
  'F#m': [
    { posicoes: [2, 4, 4, 2, 2, 2], dedos: [1, 3, 4, 1, 1, 1] },
    { posicoes: [-1, 9, 11, 11, 10, 9], dedos: [null, 1, 3, 4, 2, 1] }
  ],
  'F#7': [{ posicoes: [2, 4, 2, 3, 2, 2], dedos: [1, 3, 1, 2, 1, 1] }],
  'F#7M': [{ posicoes: [2, -1, 3, 3, 2, -1], dedos: [1, null, 3, 4, 2, null] }],
  'F#m7': [{ posicoes: [2, 4, 2, 2, 2, 2], dedos: [1, 3, 1, 1, 1, 1] }],
  'F#9': [{ posicoes: [2, 4, 2, 3, 2, 4], dedos: [1, 3, 1, 2, 1, 4] }],
  'F#dim': [{ posicoes: [2, -1, 1, 2, 1, -1], dedos: [2, null, 1, 3, 1, null] }],
  'F#m7(b5)': [{ posicoes: [2, -1, 2, 2, 1, -1], dedos: [2, null, 3, 4, 1, null] }],
  'F#sus4': [{ posicoes: [2, 4, 4, 4, 2, 2], dedos: [1, 2, 3, 4, 1, 1] }],

  // === FAMÍLIA SOL (G) ===
  'G': [
    { posicoes: [3, 2, 0, 0, 0, 3], dedos: [3, 2, null, null, null, 4] },
    { posicoes: [3, 5, 5, 4, 3, 3], dedos: [1, 3, 4, 2, 1, 1] }
  ],
  'Gm': [
    { posicoes: [3, 5, 5, 3, 3, 3], dedos: [1, 3, 4, 1, 1, 1] },
    { posicoes: [-1, 10, 12, 12, 11, 10], dedos: [null, 1, 3, 4, 2, 1] }
  ],
  'G7': [{ posicoes: [3, 2, 0, 0, 0, 1], dedos: [3, 2, null, null, null, 1] }],
  'G7M': [{ posicoes: [3, 2, 0, 0, 0, 2], dedos: [3, 2, null, null, null, 1] }],
  'Gm7': [{ posicoes: [3, 5, 3, 3, 3, 3], dedos: [1, 3, 1, 1, 1, 1] }],
  'G9': [{ posicoes: [3, -1, 3, 2, 0, -1], dedos: [2, null, 3, 1, null, null] }],
  'Gdim': [{ posicoes: [3, 4, 5, 3, 5, 3], dedos: [1, 2, 3, 1, 4, 1] }],
  'Gm7(b5)': [{ posicoes: [3, 4, 3, 3, -1, -1], dedos: [1, 2, 1, 1, null, null] }],
  'Gsus4': [{ posicoes: [3, 3, 0, 0, 3, 3], dedos: [1, 2, null, null, 3, 4] }],

  // === FAMÍLIA SOL SUSTENIDO (G#) ===
  'G#': [
    { posicoes: [4, 6, 6, 5, 4, 4], dedos: [1, 3, 4, 2, 1, 1] }
  ],
  'G#m': [
    { posicoes: [4, 6, 6, 4, 4, 4], dedos: [1, 3, 4, 1, 1, 1] }
  ],
  'G#7': [{ posicoes: [4, 6, 4, 5, 4, 4], dedos: [1, 3, 1, 2, 1, 1] }],
  'G#7M': [{ posicoes: [4, -1, 5, 5, 4, -1], dedos: [1, null, 3, 4, 2, null] }],
  'G#m7': [{ posicoes: [4, 6, 4, 4, 4, 4], dedos: [1, 3, 1, 1, 1, 1] }],
  'G#9': [{ posicoes: [4, -1, 4, 3, 4, -1], dedos: [2, null, 3, 1, 4, null] }],
  'G#dim': [{ posicoes: [4, -1, 3, 4, 3, -1], dedos: [2, null, 1, 3, 1, null] }],
  'G#m7(b5)': [{ posicoes: [4, -1, 4, 4, 3, -1], dedos: [2, null, 3, 4, 1, null] }],
  'G#sus4': [{ posicoes: [4, 6, 6, 6, 4, 4], dedos: [1, 2, 3, 4, 1, 1] }],

  // === FAMÍLIA LÁ (A) ===
  'A': [
    { posicoes: [-1, 0, 2, 2, 2, 0], dedos: [null, null, 1, 2, 3, null] },
    { posicoes: [5, 7, 7, 6, 5, 5], dedos: [1, 3, 4, 2, 1, 1] }
  ],
  'Am': [
    { posicoes: [-1, 0, 2, 2, 1, 0], dedos: [null, null, 2, 3, 1, null] },
    { posicoes: [5, 7, 7, 5, 5, 5], dedos: [1, 3, 4, 1, 1, 1] }
  ],
  'A7': [{ posicoes: [-1, 0, 2, 0, 2, 0], dedos: [null, null, 2, null, 3, null] }],
  'A7M': [{ posicoes: [-1, 0, 2, 1, 2, 0], dedos: [null, null, 2, 1, 3, null] }],
  'Am7': [{ posicoes: [-1, 0, 2, 0, 1, 0], dedos: [null, null, 2, null, 1, null] }],
  'A9': [{ posicoes: [-1, 0, 2, 4, 2, 0], dedos: [null, null, 1, 4, 2, null] }],
  'Adim': [{ posicoes: [-1, 0, 1, 2, 1, 2], dedos: [null, null, 1, 3, 2, 4] }],
  'Am7(b5)': [{ posicoes: [-1, 0, 1, 0, 1, 0], dedos: [null, null, 1, null, 2, null] }],
  'Asus4': [{ posicoes: [-1, 0, 2, 2, 3, 0], dedos: [null, null, 1, 2, 3, null] }],

  // === FAMÍLIA LÁ SUSTENIDO (A#) ===
  'A#': [
    { posicoes: [-1, 1, 3, 3, 3, 1], dedos: [null, 1, 2, 3, 4, 1] },
    { posicoes: [6, 8, 8, 7, 6, 6], dedos: [1, 3, 4, 2, 1, 1] }
  ],
  'A#m': [
    { posicoes: [-1, 1, 3, 3, 2, 1], dedos: [null, 1, 3, 4, 2, 1] },
    { posicoes: [6, 8, 8, 6, 6, 6], dedos: [1, 3, 4, 1, 1, 1] }
  ],
  'A#7': [{ posicoes: [-1, 1, 3, 1, 3, 1], dedos: [null, 1, 3, 1, 4, 1] }],
  'A#7M': [{ posicoes: [-1, 1, 3, 2, 3, 1], dedos: [null, 1, 3, 2, 4, 1] }],
  'A#m7': [{ posicoes: [-1, 1, 3, 1, 2, 1], dedos: [null, 1, 3, 1, 2, 1] }],
  'A#9': [{ posicoes: [-1, 1, 0, 1, 1, -1], dedos: [null, 2, null, 3, 4, null] }],
  'A#dim': [{ posicoes: [-1, 1, 2, 0, 2, -1], dedos: [null, 1, 2, null, 3, null] }],
  'A#m7(b5)': [{ posicoes: [-1, 1, 2, 1, 2, -1], dedos: [null, 1, 3, 2, 4, null] }],
  'A#sus4': [{ posicoes: [-1, 1, 3, 3, 4, 1], dedos: [null, 1, 2, 3, 4, 1] }],

  // === FAMÍLIA SI (B) ===
  'B': [
    { posicoes: [-1, 2, 4, 4, 4, 2], dedos: [null, 1, 2, 3, 4, 1] },
    { posicoes: [7, 9, 9, 8, 7, 7], dedos: [1, 3, 4, 2, 1, 1] }
  ],
  'Bm': [
    { posicoes: [-1, 2, 4, 4, 3, 2], dedos: [null, 1, 3, 4, 2, 1] },
    { posicoes: [7, 9, 9, 7, 7, 7], dedos: [1, 3, 4, 1, 1, 1] }
  ],
  'B7': [{ posicoes: [-1, 2, 1, 2, 0, 2], dedos: [null, 2, 1, 3, null, 4] }],
  'B7M': [{ posicoes: [-1, 2, 4, 3, 4, 2], dedos: [null, 1, 3, 2, 4, 1] }],
  'Bm7': [{ posicoes: [-1, 2, 4, 2, 3, 2], dedos: [null, 1, 3, 1, 2, 1] }],
  'B9': [{ posicoes: [-1, 2, 1, 2, 2, -1], dedos: [null, 2, 1, 3, 4, null] }],
  'Bdim': [{ posicoes: [-1, 2, 3, 1, 3, -1], dedos: [null, 2, 4, 1, 3, null] }],
  'Bm7(b5)': [{ posicoes: [-1, 2, 3, 2, 3, -1], dedos: [null, 1, 3, 2, 4, null] }],
  'Bsus4': [{ posicoes: [-1, 2, 4, 4, 5, 2], dedos: [null, 1, 2, 3, 4, 1] }],
};

// =======================================================
// MAPA DE ENARMÔNICOS (BEMÓIS AUTOMÁTICOS)
// =======================================================
// Isto garante que se o sistema procurar por "Db" (Ré bemol),
// ele vai automaticamente utilizar a estrutura do "C#" (Dó sustenido).
// Poupa-lhe o trabalho de cadastrar os mesmos acordes duas vezes!

const mapeamentoEnarmonicos = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};

// Varre todo o dicionário e clona as variações sustenidas para os equivalentes bemóis
Object.keys(mapeamentoEnarmonicos).forEach(bemolBase => {
  const sustenidoBase = mapeamentoEnarmonicos[bemolBase];

  // Procura por todas as extensões (ex: C#, C#m, C#7, etc)
  Object.keys(DICIONARIO_BRASIL).forEach(chave => {
    if (chave.startsWith(sustenidoBase)) {
      // Cria a chave bemol correspondente (ex: Db, Dbm, Db7)
      const novaChaveBemol = chave.replace(sustenidoBase, bemolBase);
      DICIONARIO_BRASIL[novaChaveBemol] = DICIONARIO_BRASIL[chave];
    }
  });
});