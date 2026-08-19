// ============================================================================
//  Edge Function: enviar-avisos
//  Dispara os lembretes de escala por Web Push. Chamada pelo pg_cron (cron.sql)
//  em três momentos:
//    • tipo=semana      → segunda de manhã, a todos os escalados da semana (sáb–sex)
//    • tipo=dia_manha   → manhã, a quem toca na missa das 12h daquele dia
//    • tipo=dia_tarde   → início da tarde, a quem toca na missa das 19h daquele dia
//
//  Segurança: exige o header `x-cron-secret` igual ao secret CRON_SECRET.
//  Idempotência: grava em `avisos_enviados` (unique tipo+referencia) — reexecutar
//  no mesmo dia/semana não duplica o envio.
//
//  Deploy:  supabase functions deploy enviar-avisos --no-verify-jwt
//  Secrets: supabase secrets set CRON_SECRET=... VAPID_PUBLIC_KEY=... \
//                                 VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:voce@exemplo.com
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const TZ = 'America/Sao_Paulo';

// Data "de hoje" no fuso de São Paulo, como YYYY-MM-DD.
function hojeSaoPaulo(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date()); // en-CA => 2026-08-19
}

// Intervalo da semana da escala (sábado anterior .. sexta seguinte) contendo `iso`.
function semanaSabSex(iso: string): { inicio: string; fim: string; chave: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const dow = base.getUTCDay(); // 0=dom .. 6=sáb
  const diasDesdeSab = (dow + 1) % 7; // sáb=0, dom=1, ... sex=6
  const inicio = new Date(base); inicio.setUTCDate(base.getUTCDate() - diasDesdeSab);
  const fim = new Date(inicio); fim.setUTCDate(inicio.getUTCDate() + 6);
  const f = (dt: Date) => dt.toISOString().slice(0, 10);
  return { inicio: f(inicio), fim: f(fim), chave: `sem-${f(inicio)}` };
}

Deno.serve(async (req) => {
  // --- Autenticação do cron ---
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('Não autorizado', { status: 401 });
  }

  const { tipo } = await req.json().catch(() => ({ tipo: '' }));
  if (!['semana', 'dia_manha', 'dia_tarde'].includes(tipo)) {
    return new Response('tipo inválido', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') || 'mailto:escala@cscb.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const hoje = hojeSaoPaulo();

  // --- Monta o filtro conforme o tipo e a referência de idempotência ---
  let query = supabase.from('v_escalados').select('*');
  let referencia = '';
  let corpoBase = '';
  if (tipo === 'semana') {
    const { inicio, fim, chave } = semanaSabSex(hoje);
    query = query.gte('data', inicio).lte('data', fim);
    referencia = chave;
    corpoBase = 'Você está escalado(a) esta semana. Confira seus dias e horários no app.';
  } else {
    const horario = tipo === 'dia_manha' ? '12:00' : '19:00';
    query = query.eq('data', hoje).eq('horario', horario);
    referencia = `${hoje}-${horario}`;
    corpoBase = `Hoje você toca na missa das ${horario}. Bom ministério! 🎶`;
  }

  // --- Idempotência: já enviado? ---
  const { data: jaEnviado } = await supabase
    .from('avisos_enviados').select('id').eq('tipo', tipo).eq('referencia', referencia).maybeSingle();
  if (jaEnviado) {
    return Response.json({ ok: true, pulado: 'já enviado', tipo, referencia });
  }

  // --- Destinatários (pessoas únicas com contato de push) ---
  const { data: escalados, error } = await query;
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const pessoaIds = [...new Set((escalados || []).map((e: any) => e.pessoa_id).filter(Boolean))];
  if (pessoaIds.length === 0) {
    await supabase.from('avisos_enviados').insert({ tipo, referencia, destinatarios: 0 });
    return Response.json({ ok: true, tipo, referencia, destinatarios: 0, obs: 'ninguém escalado com contato' });
  }

  const { data: subs } = await supabase
    .from('push_subscriptions').select('*').in('pessoa_id', pessoaIds);

  const titulo = '🎶 Escala da Música — CSCB';
  let enviados = 0;
  for (const s of subs || []) {
    const payload = JSON.stringify({ title: titulo, body: corpoBase, url: './', tag: `cscb-${tipo}` });
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      enviados++;
    } catch (err: any) {
      // 404/410 => inscrição expirada: remove
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', s.id);
      }
    }
  }

  await supabase.from('avisos_enviados').insert({ tipo, referencia, destinatarios: enviados });
  return Response.json({ ok: true, tipo, referencia, pessoas: pessoaIds.length, notificacoes: enviados });
});
