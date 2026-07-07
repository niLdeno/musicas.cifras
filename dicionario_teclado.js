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

  const COR_ROOT = "#e23b2e"; // vermelho (fundamental)
  const COR_TOM = "#f59331"; // laranja (demais notas)

  function whiteGlobalIndex(keyIndex) {
    const oct = Math.floor(keyIndex / 12);
    const s = keyIndex % 12;
    return oct * 7 + WHITE_MAP[s];
  }

  // Desenha o teclado (SVG) a partir de teclas explícitas já marcadas.
  // teclasMarcadas: [{ keyIndex (0..23), cor }]; nomes: pílulas [{nome, cor}]
  function desenharPianoSVG(nomeExibir, teclasMarcadas, nomes, opts) {
    opts = opts || {};
    const OCTAVES = 2;
    const W = opts.whiteWidth || 26;
    const totalWhite = 7 * OCTAVES;
    const pad = 10;
    const topBar = 9;
    const whiteH = 120;
    const blackW = Math.round(W * 0.6);
    const blackH = 74;
    const kbWidth = totalWhite * W;
    const caseW = kbWidth + pad * 2;
    const caseH = topBar + whiteH + pad;

    const uid = "kb" + (desenharPianoSVG._n = (desenharPianoSVG._n || 0) + 1);
    const ox = pad;
    const oy = topBar;
    function teclaPath(x, y, w, h, r) {
      return `M${x},${y} L${x + w},${y} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} Z`;
    }

    let svg = `<svg width="${caseW}" height="${caseH}" viewBox="0 0 ${caseW} ${caseH}" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto; filter:drop-shadow(0 10px 18px rgba(0,0,0,0.35));">`;
    svg += `<defs>
      <linearGradient id="${uid}-felt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a2b22"/><stop offset="1" stop-color="#641812"/></linearGradient>
      <linearGradient id="${uid}-case" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2b33"/><stop offset="1" stop-color="#15151b"/></linearGradient>
      <linearGradient id="${uid}-white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.85" stop-color="#f4f5f7"/><stop offset="1" stop-color="#e2e5ea"/></linearGradient>
      <linearGradient id="${uid}-black" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a52"/><stop offset="0.12" stop-color="#26262c"/><stop offset="0.7" stop-color="#141418"/><stop offset="1" stop-color="#050507"/></linearGradient>
      <radialGradient id="${uid}-root" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#ff7a6e"/><stop offset="0.55" stop-color="${COR_ROOT}"/><stop offset="1" stop-color="#a81d14"/></radialGradient>
      <radialGradient id="${uid}-tom" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="#ffc173"/><stop offset="0.55" stop-color="${COR_TOM}"/><stop offset="1" stop-color="#c4640f"/></radialGradient>
      <filter id="${uid}-dot" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.45"/></filter>
    </defs>`;
    svg += `<rect x="0" y="0" width="${caseW}" height="${caseH}" rx="10" fill="url(#${uid}-case)"/>`;
    svg += `<rect x="${ox}" y="0" width="${kbWidth}" height="${topBar + 4}" fill="url(#${uid}-felt)"/>`;
    for (let i = 0; i < totalWhite; i++) {
      const x = ox + i * W;
      svg += `<path d="${teclaPath(x, oy, W, whiteH, 4)}" fill="url(#${uid}-white)" stroke="#c4c8d0" stroke-width="0.75"/>`;
    }
    svg += `<rect x="${ox}" y="${oy}" width="${kbWidth}" height="10" fill="#ffffff" opacity="0.5"/>`;
    for (let oct = 0; oct < OCTAVES; oct++) {
      for (const s in BLACK_AFTER) {
        const aw = oct * 7 + BLACK_AFTER[s];
        const x = ox + (aw + 1) * W - blackW / 2;
        svg += `<path d="${teclaPath(x, oy, blackW, blackH, 2.5)}" fill="url(#${uid}-black)"/>`;
        svg += `<rect x="${x + 1.5}" y="${oy + 3}" width="${blackW - 3}" height="${blackH - 14}" rx="2" fill="#ffffff" opacity="0.06"/>`;
      }
    }
    teclasMarcadas.forEach((t) => {
      const s = ((t.keyIndex % 12) + 12) % 12;
      const grad = t.cor === COR_ROOT ? `url(#${uid}-root)` : `url(#${uid}-tom)`;
      let cx, cy, r;
      if (IS_BLACK[s]) {
        const oct = Math.floor(t.keyIndex / 12);
        const aw = oct * 7 + BLACK_AFTER[s];
        cx = ox + (aw + 1) * W;
        cy = oy + blackH - 13;
        r = Math.min(8, blackW / 2 - 0.5);
      } else {
        const wg = whiteGlobalIndex(t.keyIndex);
        cx = ox + wg * W + W / 2;
        cy = oy + whiteH - 18;
        r = Math.min(10, W / 2 - 2);
      }
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${grad}" stroke="#ffffff" stroke-width="1.5" filter="url(#${uid}-dot)"/>`;
      svg += `<circle cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.3}" fill="#ffffff" opacity="0.55"/>`;
    });
    svg += `</svg>`;

    const width = opts.width || caseW;
    let html = `<div style="width:${width}px; font-family:sans-serif; margin:0 auto;">`;
    html += `<div style="text-align:center; font-weight:800; font-size:19px; margin-bottom:12px; color:var(--text-main); letter-spacing:-0.01em;">${nomeExibir}</div>`;
    html += svg;
    if (nomes && nomes.length) {
      const listaNotas = nomes
        .map((n) => `<span style="display:inline-flex; align-items:center; gap:5px; background:${n.cor}1a; color:${n.cor}; font-weight:700; font-size:13px; padding:3px 9px; border-radius:20px; border:1px solid ${n.cor}40;"><span style="width:7px; height:7px; border-radius:50%; background:${n.cor};"></span>${n.nome}</span>`)
        .join("");
      html += `<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px; margin-top:14px;">${listaNotas}</div>`;
    }
    html += `</div>`;
    return html;
  }

  // A partir do NOME do acorde (gera pela teoria musical)
  function gerarHtmlTeclado(nomeAcorde, opts) {
    const info = obterNotasAcordeTeclado(nomeAcorde);
    if (!info) {
      return `<div style="text-align:center; font-family:sans-serif; font-size:13px; color:var(--text-muted);">Acorde <b>${nomeAcorde}</b><br>não reconhecido.</div>`;
    }
    // ── Voicing "de arranjo": separa os registros pra NÃO empastar com o violão ──
    // Em vez de uma tríade fechada e grave (que dobra exatamente o que o violão
    // toca), montamos:
    //   • MÃO ESQUERDA  = só o baixo (fundamental, ou o baixo invertido em C/E),
    //                     grave, na 1ª oitava do desenho  → tecla vermelha
    //   • MÃO DIREITA   = as notas do acorde empilhadas UMA OITAVA ACIMA (2ª
    //                     oitava), acima da região onde o violão dedilha/bate.
    //                     É essa separação de registro que "abre" o som.
    const baixoPc = (info.baixoPc !== null && info.baixoPc !== undefined)
      ? info.baixoPc
      : info.rootPc;

    const teclasMarcadas = [];
    // Baixo grave (mão esquerda) — 1ª oitava, tecla índice 0..11
    teclasMarcadas.push({ keyIndex: baixoPc, cor: COR_ROOT });

    // Estrutura da mão direita — mesmas notas do acorde, uma oitava acima
    // (índices 12..23). Como o baixo fica em 0..11 e a mão direita em 12..23,
    // os registros nunca se sobrepõem.
    info.tons.forEach((pc) => {
      teclasMarcadas.push({ keyIndex: pc + 12, cor: COR_TOM });
    });
    const nomes = info.nomes.map((n, idx) => ({ nome: n, cor: idx === 0 ? COR_ROOT : COR_TOM }));
    return desenharPianoSVG(info.nome, teclasMarcadas, nomes, opts);
  }

  // A partir de TECLAS explícitas (voicing personalizado salvo no banco)
  // teclas: array de índices 0..23; rootIndex: índice da fundamental (ou -1/null)
  function gerarHtmlTecladoDeTeclas(nomeExibir, teclas, rootIndex, opts) {
    if (!Array.isArray(teclas) || teclas.length === 0) {
      return `<div style="text-align:center; font-family:sans-serif; font-size:13px; color:var(--text-muted);">Sem teclas para <b>${nomeExibir}</b>.</div>`;
    }
    const ordenadas = teclas.slice().sort((a, b) => a - b);
    const teclasMarcadas = ordenadas.map((k) => ({
      keyIndex: k,
      cor: k === rootIndex ? COR_ROOT : COR_TOM,
    }));
    // nomes das notas: fundamental primeiro
    const comRoot = rootIndex !== null && rootIndex !== undefined && rootIndex >= 0;
    const nomesArr = [];
    if (comRoot) nomesArr.push({ nome: NOTAS_LABEL[((rootIndex % 12) + 12) % 12], cor: COR_ROOT });
    ordenadas.forEach((k) => {
      if (comRoot && k === rootIndex) return;
      nomesArr.push({ nome: NOTAS_LABEL[((k % 12) + 12) % 12], cor: COR_TOM });
    });
    return desenharPianoSVG(nomeExibir, teclasMarcadas, nomesArr, opts);
  }

  global.obterNotasAcordeTeclado = obterNotasAcordeTeclado;
  global.gerarHtmlTeclado = gerarHtmlTeclado;
  global.gerarHtmlTecladoDeTeclas = gerarHtmlTecladoDeTeclas;
})(typeof window !== "undefined" ? window : this);
