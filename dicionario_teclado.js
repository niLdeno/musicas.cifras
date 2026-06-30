/*
 * dicionario_teclado.js
 * Gera acordes de TECLADO/PIANO a partir da teoria musical.
 *
 * Diferente do violão (onde a mesma nota pode ser tocada em várias casas e
 * exige um mapa manual), no teclado um acorde é simplesmente o conjunto de
 * notas que o compõem — totalmente determinado pelas fórmulas de intervalos.
 *
 * Expõe:
 *   - obterNotasAcordeTeclado(nome)  -> { rootPc, tons, baixoPc, nomes, nome }
 *   - gerarHtmlTeclado(nome, opts)   -> string HTML com o diagrama do piano
 */
(function (global) {
  "use strict";

  const NOTAS_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const NOTAS_LABEL = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const FLAT_TO_SHARP = {
    "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#", "Cb": "B", "Fb": "E",
  };

  function pitchClass(nome) {
    if (!nome) return -1;
    let n = nome.trim();
    if (FLAT_TO_SHARP[n]) n = FLAT_TO_SHARP[n];
    return NOTAS_SHARP.indexOf(n);
  }

  // Fórmulas de intervalos (semitons a partir da fundamental).
  // A busca usa o sufixo mais longo que casar primeiro.
  const FORMULAS = [
    { suf: "m7(b5)", iv: [0, 3, 6, 10] },
    { suf: "m7b5", iv: [0, 3, 6, 10] },
    { suf: "ø", iv: [0, 3, 6, 10] },
    { suf: "m(maj7)", iv: [0, 3, 7, 11] },
    { suf: "m7m", iv: [0, 3, 7, 11] },
    { suf: "mmaj7", iv: [0, 3, 7, 11] },
    { suf: "7sus4", iv: [0, 5, 7, 10] },
    { suf: "maj7", iv: [0, 4, 7, 11] },
    { suf: "dim7", iv: [0, 3, 6, 9] },
    { suf: "sus4", iv: [0, 5, 7] },
    { suf: "sus2", iv: [0, 2, 7] },
    { suf: "7M", iv: [0, 4, 7, 11] },
    { suf: "7+", iv: [0, 4, 7, 11] },
    { suf: "dim", iv: [0, 3, 6] },
    { suf: "aug", iv: [0, 4, 8] },
    { suf: "sus", iv: [0, 5, 7] },
    { suf: "m9", iv: [0, 3, 7, 14] },
    { suf: "m6", iv: [0, 3, 7, 9] },
    { suf: "m7", iv: [0, 3, 7, 10] },
    { suf: "m", iv: [0, 3, 7] },
    { suf: "°", iv: [0, 3, 6] },
    { suf: "+", iv: [0, 4, 8] },
    { suf: "6", iv: [0, 4, 7, 9] },
    { suf: "9", iv: [0, 4, 7, 14] }, // add9 (sem 7ª) — uso mais comum no Brasil
    { suf: "7", iv: [0, 4, 7, 10] },
    { suf: "4", iv: [0, 5, 7] },
    { suf: "", iv: [0, 4, 7] }, // maior
  ];

  function acharFormula(suf) {
    const s = (suf || "").trim();
    for (const f of FORMULAS) {
      if (f.suf === s) return f;
    }
    // fallback: maior prefixo conhecido (cobre extensões não mapeadas)
    let melhor = null;
    for (const f of FORMULAS) {
      if (f.suf && s.startsWith(f.suf)) {
        if (!melhor || f.suf.length > melhor.suf.length) melhor = f;
      }
    }
    return melhor || FORMULAS[FORMULAS.length - 1];
  }

  function obterNotasAcordeTeclado(nomeAcorde) {
    if (!nomeAcorde) return null;
    let nome = String(nomeAcorde).trim();

    // Acorde com baixo invertido (ex.: C/E, G/B)
    let baixo = null;
    const partes = nome.split("/");
    if (partes.length === 2) {
      nome = partes[0].trim();
      baixo = partes[1].trim();
    }

    const mRoot = nome.match(/^([A-G])([#b]?)/);
    if (!mRoot) return null;
    const rootName = mRoot[1] + (mRoot[2] || "");
    const rootPc = pitchClass(rootName);
    if (rootPc < 0) return null;

    let suf = nome.slice(mRoot[0].length);
    suf = suf.replace(/♭/g, "b").replace(/∅/g, "ø").replace(/º/g, "°");

    const formula = acharFormula(suf);
    const iv = formula.iv;
    const tons = iv.map((x) => (rootPc + x) % 12);

    let baixoPc = null;
    if (baixo) {
      const mB = baixo.match(/^([A-G][#b]?)/);
      if (mB) {
        const p = pitchClass(mB[1]);
        if (p >= 0) baixoPc = p;
      }
    }

    const nomes = tons.map((pc) => NOTAS_LABEL[pc]);
    return { rootPc, tons, baixoPc, intervalos: iv, nomes, nome: nomeAcorde };
  }

  // ---- Renderização do diagrama de piano (SVG) ----

  const WHITE_MAP = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
  const BLACK_AFTER = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
  const IS_BLACK = { 1: true, 3: true, 6: true, 8: true, 10: true };

  function gerarHtmlTeclado(nomeAcorde, opts) {
    opts = opts || {};
    const info = obterNotasAcordeTeclado(nomeAcorde);
    if (!info) {
      return `<div style="text-align:center; font-family:sans-serif; font-size:13px; color:var(--text-muted);">Acorde <b>${nomeAcorde}</b><br>não reconhecido.</div>`;
    }

    const OCTAVES = 2;
    const W = opts.whiteWidth || 22; // largura tecla branca
    const totalWhite = 7 * OCTAVES;
    const kbWidth = totalWhite * W;
    const whiteH = 100;
    const blackW = Math.round(W * 0.62);
    const blackH = 62;
    const topBar = 7;

    const COR_ROOT = "#d92d20"; // vermelho (fundamental)
    const COR_TOM = "#e8821e"; // laranja (demais notas)

    // Define a oitava de cada nota mantendo a fundamental na oitava de baixo
    // e empilhando as demais ascendentemente (encaixotando em 2 oitavas).
    const teclasMarcadas = []; // { keyIndex, cor }
    info.intervalos.forEach((iv) => {
      let keyIndex = info.rootPc + iv; // semitom a partir do C da 1ª oitava
      while (keyIndex >= 12 * OCTAVES) keyIndex -= 12;
      const cor = iv === 0 ? COR_ROOT : COR_TOM;
      teclasMarcadas.push({ keyIndex, cor });
    });

    // Baixo invertido: destaca a tecla do baixo em vermelho e a fundamental vira laranja
    if (info.baixoPc !== null && info.baixoPc !== info.rootPc) {
      teclasMarcadas.forEach((t) => {
        if (t.cor === COR_ROOT) t.cor = COR_TOM;
      });
      teclasMarcadas.push({ keyIndex: info.baixoPc, cor: COR_ROOT });
    }

    function whiteGlobalIndex(keyIndex) {
      const oct = Math.floor(keyIndex / 12);
      const s = keyIndex % 12;
      return oct * 7 + WHITE_MAP[s];
    }

    // SVG
    const svgH = topBar + whiteH;
    let svg = `<svg width="${kbWidth}" height="${svgH}" viewBox="0 0 ${kbWidth} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="display:block; border-radius:4px; box-shadow:0 6px 14px rgba(0,0,0,0.25);">`;

    // Barra superior (feltro/madeira) como no material de referência
    svg += `<rect x="0" y="0" width="${kbWidth}" height="${topBar}" fill="#7a1f1f"/>`;

    // Teclas brancas
    for (let i = 0; i < totalWhite; i++) {
      const x = i * W;
      svg += `<rect x="${x}" y="${topBar}" width="${W}" height="${whiteH}" fill="#fbfbfb" stroke="#9aa0aa" stroke-width="1"/>`;
    }

    // Teclas pretas (desenhadas por cima)
    for (let oct = 0; oct < OCTAVES; oct++) {
      for (const s in BLACK_AFTER) {
        const aw = oct * 7 + BLACK_AFTER[s];
        const x = (aw + 1) * W - blackW / 2;
        svg += `<rect x="${x}" y="${topBar}" width="${blackW}" height="${blackH}" rx="2" fill="#181818"/>`;
      }
    }

    // Marcadores (bolinhas) nas teclas do acorde
    teclasMarcadas.forEach((t) => {
      const s = t.keyIndex % 12;
      let cx, cy, r;
      if (IS_BLACK[s]) {
        const oct = Math.floor(t.keyIndex / 12);
        const aw = oct * 7 + BLACK_AFTER[s];
        cx = (aw + 1) * W;
        cy = topBar + blackH - 12;
        r = Math.min(8, blackW / 2 - 1);
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.cor}" stroke="#fff" stroke-width="1.5"/>`;
      } else {
        const wg = whiteGlobalIndex(t.keyIndex);
        cx = wg * W + W / 2;
        cy = topBar + whiteH - 16;
        r = Math.min(9, W / 2 - 2);
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.cor}" stroke="#fff" stroke-width="1.5"/>`;
      }
    });

    svg += `</svg>`;

    const width = opts.width || kbWidth;
    let html = `<div style="width:${width}px; font-family:sans-serif; margin:0 auto;">`;
    html += `<div style="text-align:center; font-weight:bold; font-size:18px; margin-bottom:12px; color:var(--text-main);">${info.nome}</div>`;
    html += svg;
    // Lista de notas do acorde
    const listaNotas = info.nomes
      .map((n, idx) => {
        const cor = idx === 0 ? COR_ROOT : COR_TOM;
        return `<span style="color:${cor}; font-weight:700;">${n}</span>`;
      })
      .join('<span style="color:var(--text-muted);"> · </span>');
    html += `<div style="text-align:center; margin-top:10px; font-size:14px; letter-spacing:0.02em;">${listaNotas}</div>`;
    html += `</div>`;
    return html;
  }

  global.obterNotasAcordeTeclado = obterNotasAcordeTeclado;
  global.gerarHtmlTeclado = gerarHtmlTeclado;
})(typeof window !== "undefined" ? window : this);
