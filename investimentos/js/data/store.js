// ============================================================================
//  Repositório local: todos os dados ficam SÓ no seu navegador (localStorage).
//  Nada é enviado a servidores — exceto os códigos dos ativos, para buscar a
//  cotação. Esquema versionado para permitir migrações futuras sem perda.
// ============================================================================

const CHAVE = 'carteira-investimentos:v1';
export const VERSAO_ESQUEMA = 1;

const vazio = () => ({
  versao: VERSAO_ESQUEMA,
  lancamentos: [],
  proventos: [],
  cotacoes: {},     // { TICKER: { preco, variacaoDia, nome, atualizadoEm, manual } }
  fotografias: [],  // [{ data, patrimonio, custo }] — 1 por dia, para o gráfico de evolução
  config: {
    tokenBrapi: '',
    metas: {},       // { acao: 0.5, fii: 0.3, ... }
    ocultarValores: false,
    tema: 'auto',
    demo: false,
  },
});

let estado = carregar();
const ouvintes = new Set();

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio();
    return migrar(JSON.parse(bruto));
  } catch (e) {
    console.error('Falha ao ler dados locais', e);
    return vazio();
  }
}

/** Ponto único de migração entre versões do esquema. */
function migrar(dados) {
  const base = vazio();
  return { ...base, ...dados, config: { ...base.config, ...(dados.config || {}) }, versao: VERSAO_ESQUEMA };
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch (e) {
    console.error('Falha ao salvar', e);
    throw new Error('Não foi possível salvar os dados neste navegador (armazenamento cheio ou bloqueado).');
  }
  ouvintes.forEach((fn) => fn(estado));
}

const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export const store = {
  get: () => estado,
  assinar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },

  // --- Lançamentos (compra, venda, eventos) --------------------------------
  salvarLancamento(l) {
    if (l.id) {
      estado.lancamentos = estado.lancamentos.map((x) => (x.id === l.id ? { ...x, ...l } : x));
    } else {
      estado.lancamentos.push({ ...l, id: novoId(), criadoEm: Date.now() });
    }
    salvar();
  },
  adicionarLancamentos(lista) {
    const agora = Date.now();
    lista.forEach((l, i) => estado.lancamentos.push({ ...l, id: novoId(), criadoEm: agora + i }));
    salvar();
  },
  excluirLancamento(id) {
    estado.lancamentos = estado.lancamentos.filter((x) => x.id !== id);
    salvar();
  },

  // --- Proventos ------------------------------------------------------------
  salvarProvento(p) {
    if (p.id) estado.proventos = estado.proventos.map((x) => (x.id === p.id ? { ...x, ...p } : x));
    else estado.proventos.push({ ...p, id: novoId(), criadoEm: Date.now() });
    salvar();
  },
  excluirProvento(id) {
    estado.proventos = estado.proventos.filter((x) => x.id !== id);
    salvar();
  },

  // --- Cotações e fotografias ----------------------------------------------
  atualizarCotacoes(novas) {
    estado.cotacoes = { ...estado.cotacoes, ...novas };
    salvar();
  },
  definirCotacaoManual(ticker, preco) {
    estado.cotacoes[ticker] = { preco, manual: true, atualizadoEm: new Date().toISOString(), nome: estado.cotacoes[ticker]?.nome || '' };
    salvar();
  },
  registrarFotografia(data, patrimonio, custo) {
    if (!(patrimonio > 0)) return;
    estado.fotografias = estado.fotografias.filter((f) => f.data !== data);
    estado.fotografias.push({ data, patrimonio, custo });
    estado.fotografias.sort((a, b) => a.data.localeCompare(b.data));
    if (estado.fotografias.length > 3650) estado.fotografias = estado.fotografias.slice(-3650);
    salvar();
  },

  // --- Configurações --------------------------------------------------------
  configurar(parcial) {
    estado.config = { ...estado.config, ...parcial };
    salvar();
  },

  // --- Backup ---------------------------------------------------------------
  exportar() {
    return {
      app: 'carteira-investimentos',
      versao: VERSAO_ESQUEMA,
      exportadoEm: new Date().toISOString(),
      dados: { ...estado, config: { ...estado.config, tokenBrapi: '' } }, // nunca exporta o token
    };
  },
  importar(backup) {
    const tokenAtual = estado.config.tokenBrapi;
    estado = migrar(backup.dados);
    estado.config.tokenBrapi = estado.config.tokenBrapi || tokenAtual;
    estado.config.demo = false;
    salvar();
  },
  substituirTudo(dados) {
    estado = migrar({ ...vazio(), ...dados });
    salvar();
  },
  apagarTudo() {
    const token = estado.config.tokenBrapi;
    estado = vazio();
    estado.config.tokenBrapi = token;
    salvar();
  },
};
