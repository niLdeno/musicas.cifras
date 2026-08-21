-- ============================================================================
--  AGENDAMENTO DOS AVISOS  (pg_cron + pg_net → Edge Function enviar-avisos)
--  Rode DEPOIS de publicar a função `enviar-avisos`.
--
--  Horários em BRT (America/Sao_Paulo, UTC-3). O pg_cron roda em UTC, então:
--     08:00 BRT = 11:00 UTC   |   15:00 BRT = 18:00 UTC
--
--  ANTES de rodar, substitua <PROJECT_REF> pela referência do seu projeto
--  (ex.: azscmfqhqarpudwjcgky).
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- ----------------------------------------------------------------------------
--  Segredo do cron guardado no VAULT (não em texto puro no corpo da função).
--  Rode UMA vez, trocando pelo valor definido em `supabase secrets set CRON_SECRET=...`:
--
--     select vault.create_secret('COLE-AQUI-O-CRON_SECRET', 'cron_secret');
--
--  (Para atualizar depois: select vault.update_secret((select id from vault.secrets
--   where name='cron_secret'), 'novo-valor');)
-- ----------------------------------------------------------------------------

-- Função que chama a Edge Function. `security definer` + search_path fixo evita
-- sequestro de resolução de nomes; o segredo é lido do Vault em tempo de execução.
create or replace function public.disparar_aviso(p_tipo text)
returns void language plpgsql security definer set search_path = public, vault as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'cron_secret';
  perform net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/enviar-avisos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body    := jsonb_build_object('tipo', p_tipo)
  );
end $$;

-- A função NÃO pode ser executável por usuários comuns (senão qualquer logado
-- dispararia notificações, mesmo sem conhecer o segredo). Só o dono/cron a chama.
revoke all on function public.disparar_aviso(text) from public;
revoke all on function public.disparar_aviso(text) from anon, authenticated;

-- Remove agendamentos antigos (evita duplicar ao reexecutar este arquivo).
select cron.unschedule(jobid) from cron.job
  where jobname in ('aviso_semana', 'aviso_dia_manha', 'aviso_dia_tarde');

-- Segunda-feira, 08:00 BRT (11:00 UTC): todos os escalados da semana.
select cron.schedule('aviso_semana', '0 11 * * 1', $$ select public.disparar_aviso('semana'); $$);

-- Todo dia, 08:00 BRT (11:00 UTC): quem toca na missa das 12h.
select cron.schedule('aviso_dia_manha', '0 11 * * *', $$ select public.disparar_aviso('dia_manha'); $$);

-- Todo dia, 15:00 BRT (18:00 UTC): quem toca na missa das 19h.
select cron.schedule('aviso_dia_tarde', '0 18 * * *', $$ select public.disparar_aviso('dia_tarde'); $$);

-- Para conferir os agendamentos:   select * from cron.job;
-- Para ver o histórico de execução: select * from cron.job_run_details order by start_time desc limit 20;
