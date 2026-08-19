// ============================================================================
//  MODO DEMO — backend simulado em localStorage.
//  Nasce populado com a escala de Agosto/2026, grupos, comunicados e alterações,
//  para que o app funcione 100% offline (ideal para demonstração e testes).
//  Expõe exatamente a mesma API assíncrona do backend Supabase (data/supa.js).
// ============================================================================
import { escalaAgosto2026, gruposAgosto2026, ANO, MES } from './agosto2026.js';
import { uid } from '../util.js';

const CHAVE = 'cscb.escala.v3';

function agoraISO() {
  return new Date().toISOString();
}

function semear() {
  // Uma "pessoa" para cada unidade escalada (para os avisos alcançarem alguém),
  // mais a coordenação e um músico de exemplo.
  const pessoas = gruposAgosto2026.map((nome) => ({
    id: uid(),
    user_id: null,
    nome,
    email: null,
    telefone: null,
    papel: 'musico',
    ativo: true,
    criado_em: agoraISO(),
  }));
  const coord = {
    id: uid(), user_id: 'demo-admin', nome: 'Nildeno Aragão',
    email: 'nildeno.aragao@gmail.com', telefone: null,
    papel: 'admin', ativo: true, criado_em: agoraISO(),
  };
  pessoas.push(coord);

  const grupos = gruposAgosto2026.map((nome) => {
    const pessoa = pessoas.find((p) => p.nome === nome);
    return { id: uid(), nome, cor: null, ativo: true, membros: [pessoa.id], criado_em: agoraISO() };
  });
  const grupoPorNome = Object.fromEntries(grupos.map((g) => [g.nome, g]));

  const escala = {
    id: uid(), ano: ANO, mes: MES, versao: 2, publicada: true,
    publicada_em: agoraISO(), observacoes: null, criado_em: agoraISO(),
  };

  const itens = escalaAgosto2026.map((it) => ({
    id: uid(),
    escala_id: escala.id,
    data: it.data,
    horario: it.horario,
    grupo_id: grupoPorNome[it.grupo] ? grupoPorNome[it.grupo].id : null,
    rotulo: grupoPorNome[it.grupo] ? null : it.grupo,
    status: it.status,
    observacao: it.observacao,
    criado_em: agoraISO(),
  }));

  const comunicados = [
    {
      id: uid(), titulo: 'Bem-vindos à nova Escala Digital 🎶',
      corpo:
        'A partir de agora a escala mensal fica aqui, sempre atualizada. Ative as notificações para receber os lembretes automáticos no começo da semana e no dia da sua missa.',
      fixado: true, publicado: true, autor: 'Coordenação', criado_em: agoraISO(),
    },
    {
      id: uid(), titulo: 'Ensaio geral — sábado 15/08',
      corpo:
        'Ensaio aberto a todos os grupos às 16h, na capela. Traga seu instrumento. Foco no repertório das solenidades do mês.',
      fixado: false, publicado: true, autor: 'Coordenação',
      criado_em: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  const alteracoes = [
    {
      id: uid(), escala_id: escala.id, item_id: null,
      descricao: '19/08 (19h): Nildeno entrou como substituição.',
      autor: 'Coordenação', criado_em: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: uid(), escala_id: escala.id, item_id: null,
      descricao: '14/08 e 15/08: Banda Consagração por inversão de escala.',
      autor: 'Coordenação', criado_em: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  return {
    pessoas, grupos, escalas: [escala], itens, alteracoes, comunicados,
    prefsNotif: { ativado: false, pessoaId: null },
    usuario: null,
  };
}

function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const s = semear();
  salvar(s);
  return s;
}

let estado = null;
function db() {
  if (!estado) estado = carregar();
  return estado;
}
function salvar(s) {
  estado = s || estado;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch (_) {}
}

const clone = (x) => JSON.parse(JSON.stringify(x));
const espelhar = () => Promise.resolve(); // ponto de simetria com chamadas de rede

let ouvintes = [];
function notificar() {
  ouvintes.forEach((cb) => cb(db().usuario));
}

export function criarMockStore() {
  return {
    modo: 'demo',

    // ---- AUTENTICAÇÃO (simulada) ----
    auth: {
      async usuarioAtual() {
        return db().usuario ? clone(db().usuario) : null;
      },
      // No demo, "entrar" escolhe um papel para experimentar o app.
      async entrarDemo(papel) {
        const s = db();
        if (papel === 'admin') {
          const coord = s.pessoas.find((p) => p.papel === 'admin');
          s.usuario = { id: coord.id, nome: coord.nome, email: coord.email, papel: 'admin' };
        } else {
          // entra como um músico que ainda tem missas à frente no mês (demo mais rica);
          // se ninguém tiver, cai no primeiro músico da lista.
          const hojeISO = new Date().toISOString().slice(0, 10);
          const grupoComFuturo = s.itens
            .filter((i) => i.data >= hojeISO && i.grupo_id)
            .map((i) => i.grupo_id);
          const grupoAlvo = s.grupos.find((g) => grupoComFuturo.includes(g.id) && g.membros.length);
          const musico =
            (grupoAlvo && s.pessoas.find((p) => p.id === grupoAlvo.membros[0])) ||
            s.pessoas.find((p) => p.papel === 'musico') ||
            s.pessoas[0];
          s.usuario = { id: musico.id, nome: musico.nome, email: musico.email, papel: 'musico' };
          s.prefsNotif.pessoaId = musico.id;
        }
        salvar(s);
        notificar();
        return clone(s.usuario);
      },
      async sair() {
        const s = db();
        s.usuario = null;
        salvar(s);
        notificar();
      },
      aoMudar(cb) {
        ouvintes.push(cb);
        return () => (ouvintes = ouvintes.filter((f) => f !== cb));
      },
    },

    // ---- PESSOAS ----
    pessoas: {
      async listar() {
        return clone(db().pessoas).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      },
      async salvar(p) {
        const s = db();
        if (p.id) {
          const i = s.pessoas.findIndex((x) => x.id === p.id);
          if (i >= 0) s.pessoas[i] = { ...s.pessoas[i], ...p };
        } else {
          // id/criado_em por ÚLTIMO: o spread de `p` traz `id: undefined` das telas
          // (id: entidade ? entidade.id : undefined) e sobrescreveria o uid() gerado.
          s.pessoas.push({ ativo: true, papel: 'musico', ...p, id: uid(), criado_em: agoraISO() });
        }
        salvar(s);
        return espelhar();
      },
      async remover(id) {
        const s = db();
        s.pessoas = s.pessoas.filter((p) => p.id !== id);
        s.grupos.forEach((g) => (g.membros = g.membros.filter((m) => m !== id)));
        salvar(s);
        return espelhar();
      },
    },

    // ---- GRUPOS ----
    grupos: {
      async listar() {
        const s = db();
        return clone(s.grupos)
          .map((g) => ({
            ...g,
            integrantes: g.membros
              .map((id) => s.pessoas.find((p) => p.id === id))
              .filter(Boolean)
              .map((p) => ({ id: p.id, nome: p.nome })),
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      },
      async salvar(g) {
        const s = db();
        if (g.id) {
          const i = s.grupos.findIndex((x) => x.id === g.id);
          if (i >= 0) s.grupos[i] = { ...s.grupos[i], ...g, membros: g.membros || s.grupos[i].membros };
        } else {
          s.grupos.push({ ativo: true, membros: [], ...g, id: uid(), criado_em: agoraISO() });
        }
        salvar(s);
        return espelhar();
      },
      async remover(id) {
        const s = db();
        s.grupos = s.grupos.filter((g) => g.id !== id);
        s.itens.forEach((it) => { if (it.grupo_id === id) it.grupo_id = null; });
        salvar(s);
        return espelhar();
      },
    },

    // ---- ESCALA ----
    escala: {
      async mesesDisponiveis() {
        return clone(db().escalas)
          .map((e) => ({ id: e.id, ano: e.ano, mes: e.mes, publicada: e.publicada, versao: e.versao }))
          .sort((a, b) => b.ano - a.ano || b.mes - a.mes);
      },
      async obter(ano, mes) {
        const s = db();
        const escala = s.escalas.find((e) => e.ano === ano && e.mes === mes) || null;
        const itens = escala ? clone(s.itens.filter((i) => i.escala_id === escala.id)) : [];
        const gruposById = Object.fromEntries(s.grupos.map((g) => [g.id, g.nome]));
        itens.forEach((i) => (i.grupoNome = i.grupo_id ? gruposById[i.grupo_id] : i.rotulo));
        return { escala: escala ? clone(escala) : null, itens };
      },
      async criarMes(ano, mes) {
        const s = db();
        let escala = s.escalas.find((e) => e.ano === ano && e.mes === mes);
        if (!escala) {
          escala = { id: uid(), ano, mes, versao: 1, publicada: false, publicada_em: null, observacoes: null, criado_em: agoraISO() };
          s.escalas.push(escala);
          salvar(s);
        }
        return clone(escala);
      },
      async salvarItem(item) {
        const s = db();
        const chave = (i) => i.escala_id === item.escala_id && i.data === item.data && i.horario === item.horario;
        const i = s.itens.findIndex((x) => (item.id ? x.id === item.id : chave(x)));
        if (i >= 0) s.itens[i] = { ...s.itens[i], ...item };
        else s.itens.push({ status: 'confirmada', ...item, id: uid(), criado_em: agoraISO() });
        salvar(s);
        return espelhar();
      },
      async removerItem(id) {
        const s = db();
        s.itens = s.itens.filter((i) => i.id !== id);
        salvar(s);
        return espelhar();
      },
      async publicar(escalaId, publicar = true) {
        const s = db();
        const e = s.escalas.find((x) => x.id === escalaId);
        if (e) {
          e.publicada = publicar;
          e.publicada_em = publicar ? agoraISO() : null;
          if (publicar) e.versao += 1;
        }
        salvar(s);
        return espelhar();
      },
    },

    // ---- ALTERAÇÕES ----
    alteracoes: {
      async listar(escalaId) {
        return clone(db().alteracoes.filter((a) => a.escala_id === escalaId)).sort(
          (a, b) => new Date(b.criado_em) - new Date(a.criado_em)
        );
      },
      async registrar(a) {
        const s = db();
        s.alteracoes.push({ ...a, id: uid(), criado_em: agoraISO() });
        salvar(s);
        return espelhar();
      },
    },

    // ---- COMUNICADOS ----
    comunicados: {
      async listar() {
        return clone(db().comunicados.filter((c) => c.publicado !== false)).sort(
          (a, b) => (b.fixado - a.fixado) || (new Date(b.criado_em) - new Date(a.criado_em))
        );
      },
      async salvar(c) {
        const s = db();
        if (c.id) {
          const i = s.comunicados.findIndex((x) => x.id === c.id);
          if (i >= 0) s.comunicados[i] = { ...s.comunicados[i], ...c };
        } else {
          s.comunicados.push({ publicado: true, fixado: false, ...c, id: uid(), criado_em: agoraISO() });
        }
        salvar(s);
        return espelhar();
      },
      async remover(id) {
        const s = db();
        s.comunicados = s.comunicados.filter((c) => c.id !== id);
        salvar(s);
        return espelhar();
      },
    },

    // ---- NOTIFICAÇÕES (preferência local no demo) ----
    notif: {
      async pref() {
        return clone(db().prefsNotif);
      },
      async setPref(ativado) {
        const s = db();
        s.prefsNotif.ativado = ativado;
        salvar(s);
        return espelhar();
      },
    },

    // ---- RESET (só demo) ----
    async resetDemo() {
      localStorage.removeItem(CHAVE);
      estado = null;
      db();
      notificar();
    },
  };
}
