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

function nomeCompleto(p) {
  return [p.nome, p.sobrenome].filter(Boolean).join(' ');
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
    id: uid(), user_id: 'demo-admin', nome: 'Nildeno', sobrenome: 'Aragão',
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
    id: uid(), ano: ANO, mes: MES, versao: 1, publicada: true,
    publicada_em: agoraISO(),
    observacoes: 'Cheguem 20 min antes para a passagem de som. Dúvidas sobre a escala, falar com a coordenação.',
    criado_em: agoraISO(),
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
          s.usuario = { id: coord.id, nome: nomeCompleto(coord), email: coord.email, papel: 'admin' };
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
          s.usuario = { id: musico.id, nome: nomeCompleto(musico), email: musico.email, papel: 'musico' };
          s.prefsNotif.pessoaId = musico.id;
        }
        salvar(s);
        notificar();
        return clone(s.usuario);
      },
      // Autocadastro do músico: cria a pessoa e um "grupo" solo com o mesmo nome
      // (assim ele já vira uma unidade selecionável na escala) e entra no app.
      async cadastrarMusico({ nome, sobrenome, telefone, email }) {
        const s = db();
        const completo = [nome, sobrenome].filter(Boolean).join(' ');
        if (s.pessoas.some((p) => p.email && email && p.email.toLowerCase() === email.toLowerCase())) {
          throw new Error('Já existe um cadastro com esse e-mail.');
        }
        const pessoa = {
          id: uid(), user_id: null, nome, sobrenome: sobrenome || null,
          email: email || null, telefone: telefone || null,
          papel: 'musico', ativo: true, criado_em: agoraISO(),
        };
        s.pessoas.push(pessoa);
        if (!s.grupos.some((g) => g.nome.toLowerCase() === completo.toLowerCase())) {
          s.grupos.push({ id: uid(), nome: completo, cor: null, ativo: true, membros: [pessoa.id], criado_em: agoraISO() });
        }
        s.usuario = { id: pessoa.id, nome: completo, email: pessoa.email, papel: 'musico' };
        s.prefsNotif.pessoaId = pessoa.id;
        salvar(s);
        notificar();
        return clone(pessoa);
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
          // versao 0 = rascunho ainda não publicado; a 1ª publicação vira v1.
          escala = { id: uid(), ano, mes, versao: 0, publicada: false, publicada_em: null, observacoes: null, criado_em: agoraISO() };
          s.escalas.push(escala);
          salvar(s);
        }
        return clone(escala);
      },
      // PRÉ-ESCALA: usa uma escala já montada de outro mês como base. Copia por
      // (dia da semana + nª ocorrência no mês + horário), preservando o padrão
      // (ex.: "1ª segunda 12h = Isaac"). O status volta a "confirmada".
      async copiarDe(sourceEscalaId, ano, mes) {
        const s = db();
        const alvo = s.escalas.find((e) => e.ano === ano && e.mes === mes)
          || (s.escalas.push({ id: uid(), ano, mes, versao: 0, publicada: false, publicada_em: null, observacoes: null, criado_em: agoraISO() }), s.escalas[s.escalas.length - 1]);

        const chaveDia = (iso, horario) => {
          const [y, m, d] = iso.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          const dow = dt.getDay();
          const ocorrencia = Math.floor((d - 1) / 7) + 1; // nª vez desse dia da semana no mês
          return `${dow}|${ocorrencia}|${horario}`;
        };
        const fonte = {};
        s.itens.filter((i) => i.escala_id === sourceEscalaId).forEach((i) => {
          fonte[chaveDia(i.data, i.horario)] = { grupo_id: i.grupo_id, rotulo: i.rotulo };
        });

        const totalDias = new Date(ano, mes, 0).getDate();
        let copiados = 0;
        for (let d = 1; d <= totalDias; d++) {
          const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          for (const horario of ['12:00', '19:00']) {
            const base = fonte[chaveDia(iso, horario)];
            if (!base || (!base.grupo_id && !base.rotulo)) continue;
            const jaExiste = s.itens.some((i) => i.escala_id === alvo.id && i.data === iso && i.horario === horario);
            if (jaExiste) continue;
            s.itens.push({ id: uid(), escala_id: alvo.id, data: iso, horario, grupo_id: base.grupo_id || null, rotulo: base.rotulo || null, status: 'confirmada', observacao: null, criado_em: agoraISO() });
            copiados++;
          }
        }
        salvar(s);
        return { escala: clone(alvo), copiados };
      },
      async salvarObservacoes(escalaId, texto) {
        const s = db();
        const e = s.escalas.find((x) => x.id === escalaId);
        if (e) e.observacoes = texto || null;
        salvar(s);
        return espelhar();
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
          if (publicar) e.versao = (e.versao || 0) + 1; // 1ª publicação = v1; ajustes seguintes incrementam
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
