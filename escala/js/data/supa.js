// ============================================================================
//  Backend SUPABASE (produção). Mesma API do mock (data/mock.js).
//  Requer o script @supabase/supabase-js carregado no index.html (window.supabase).
//  As permissões reais são garantidas pelo RLS (supabase/policies.sql) — este
//  arquivo assume que qualquer escrita indevida será barrada pelo banco.
// ============================================================================
import { CONFIG } from '../config.js';

export async function criarSupaStore() {
  if (!window.supabase) throw new Error('SDK do Supabase não carregado.');
  const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  async function pessoaDoUsuario(user) {
    if (!user) return null;
    const { data } = await sb.from('pessoas').select('*').eq('user_id', user.id).maybeSingle();
    const ehAdmin = (user.email || '').toLowerCase() === CONFIG.ADMIN_EMAIL.toLowerCase();
    return {
      id: data?.id || user.id,
      nome: data?.nome || user.email,
      email: user.email,
      papel: ehAdmin ? 'admin' : data?.papel || 'musico',
    };
  }

  return {
    modo: 'supabase',
    sb,

    auth: {
      async usuarioAtual() {
        const { data } = await sb.auth.getSession();
        return pessoaDoUsuario(data?.session?.user || null);
      },
      async entrar(email, senha) {
        const { error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      },
      async cadastrar(email, senha) {
        const { error } = await sb.auth.signUp({ email, password: senha });
        if (error) throw error;
      },
      async recuperarSenha(email) {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href });
        if (error) throw error;
      },
      async sair() {
        await sb.auth.signOut();
      },
      aoMudar(cb) {
        const { data } = sb.auth.onAuthStateChange(async (_e, session) => {
          cb(await pessoaDoUsuario(session?.user || null));
        });
        return () => data.subscription.unsubscribe();
      },
    },

    pessoas: {
      async listar() {
        const { data, error } = await sb.from('pessoas').select('*').order('nome');
        if (error) throw error;
        return data || [];
      },
      async salvar(p) {
        const { error } = p.id
          ? await sb.from('pessoas').update(p).eq('id', p.id)
          : await sb.from('pessoas').insert([p]);
        if (error) throw error;
      },
      async remover(id) {
        const { error } = await sb.from('pessoas').delete().eq('id', id);
        if (error) throw error;
      },
    },

    grupos: {
      async listar() {
        const { data, error } = await sb
          .from('grupos')
          .select('*, grupo_membros(pessoa_id, pessoas(id, nome))')
          .order('nome');
        if (error) throw error;
        return (data || []).map((g) => ({
          ...g,
          integrantes: (g.grupo_membros || []).map((m) => m.pessoas).filter(Boolean),
          membros: (g.grupo_membros || []).map((m) => m.pessoa_id),
        }));
      },
      async salvar(g) {
        const { membros, integrantes, id, ...campos } = g;
        let grupoId = id;
        if (id) {
          const { error } = await sb.from('grupos').update(campos).eq('id', id);
          if (error) throw error;
        } else {
          const { data, error } = await sb.from('grupos').insert([campos]).select().single();
          if (error) throw error;
          grupoId = data.id;
        }
        if (Array.isArray(membros)) {
          await sb.from('grupo_membros').delete().eq('grupo_id', grupoId);
          if (membros.length) {
            await sb.from('grupo_membros').insert(membros.map((pessoa_id) => ({ grupo_id: grupoId, pessoa_id })));
          }
        }
      },
      async remover(id) {
        const { error } = await sb.from('grupos').delete().eq('id', id);
        if (error) throw error;
      },
    },

    escala: {
      async mesesDisponiveis() {
        const { data, error } = await sb.from('escalas').select('id, ano, mes, publicada, versao').order('ano', { ascending: false }).order('mes', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async obter(ano, mes) {
        const { data: escala } = await sb.from('escalas').select('*').eq('ano', ano).eq('mes', mes).maybeSingle();
        if (!escala) return { escala: null, itens: [] };
        const { data: itens, error } = await sb
          .from('escala_itens')
          .select('*, grupos(nome)')
          .eq('escala_id', escala.id)
          .order('data');
        if (error) throw error;
        return {
          escala,
          itens: (itens || []).map((i) => ({ ...i, grupoNome: i.grupos?.nome || i.rotulo })),
        };
      },
      async criarMes(ano, mes) {
        const { data, error } = await sb.from('escalas').upsert({ ano, mes }, { onConflict: 'ano,mes' }).select().single();
        if (error) throw error;
        return data;
      },
      async salvarItem(item) {
        const { grupoNome, ...campos } = item;
        const { error } = await sb.from('escala_itens').upsert(campos, { onConflict: 'escala_id,data,horario' });
        if (error) throw error;
      },
      async removerItem(id) {
        const { error } = await sb.from('escala_itens').delete().eq('id', id);
        if (error) throw error;
      },
      async publicar(escalaId, publicar = true) {
        const { data: atual } = await sb.from('escalas').select('versao').eq('id', escalaId).single();
        const patch = { publicada: publicar, publicada_em: publicar ? new Date().toISOString() : null };
        if (publicar) patch.versao = (atual?.versao || 1) + 1;
        const { error } = await sb.from('escalas').update(patch).eq('id', escalaId);
        if (error) throw error;
      },
    },

    alteracoes: {
      async listar(escalaId) {
        const { data, error } = await sb.from('escala_alteracoes').select('*').eq('escala_id', escalaId).order('criado_em', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async registrar(a) {
        const { error } = await sb.from('escala_alteracoes').insert([a]);
        if (error) throw error;
      },
    },

    comunicados: {
      async listar() {
        const { data, error } = await sb.from('comunicados').select('*').order('fixado', { ascending: false }).order('criado_em', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async salvar(c) {
        const { error } = c.id
          ? await sb.from('comunicados').update(c).eq('id', c.id)
          : await sb.from('comunicados').insert([c]);
        if (error) throw error;
      },
      async remover(id) {
        const { error } = await sb.from('comunicados').delete().eq('id', id);
        if (error) throw error;
      },
    },

    notif: {
      // A preferência real é "existe uma inscrição de push para esta pessoa?".
      // O gerenciamento da inscrição (subscribe/unsubscribe) fica em js/push.js.
      async pref() {
        const { data: sess } = await sb.auth.getSession();
        const user = sess?.session?.user;
        if (!user) return { ativado: false, pessoaId: null };
        const { data: pessoa } = await sb.from('pessoas').select('id').eq('user_id', user.id).maybeSingle();
        if (!pessoa) return { ativado: false, pessoaId: null };
        const { count } = await sb.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('pessoa_id', pessoa.id);
        return { ativado: (count || 0) > 0, pessoaId: pessoa.id };
      },
      async setPref() {
        /* no-op: a inscrição de push é feita em js/push.js */
      },
    },
  };
}
