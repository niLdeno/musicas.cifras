-- ============================================================================
--  AGENDAMENTO DOS AVISOS  (pg_cron + pg_net → Edge Function enviar-avisos)
--  Rode DEPOIS de publicar a função `enviar-avisos`.
--
--  Horários em BRT (America/Sao_Paulo, UTC-3). O pg_cron roda em UTC, então:
--     08:00 BRT = 11:00 UTC   |   15:00 BRT = 18:00 UTC
--
--  ANTES de rodar, substitua:
--     <PROJECT_REF>   → a referência do seu projeto (ex.: azscmfqhqarpudwjcgky)
--     <CRON_SECRET>   → o mesmo valor definido em `supabase secrets set CRON_SECRET=...`
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Função auxiliar: chama a Edge Function com o tipo de aviso.
create or replace function public.disparar_aviso(p_tipo text)
returns void language plpgsql security definer as $$
begin
  perform net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/enviar-avisos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body    := jsonb_build_object('tipo', p_tipo)
  );
end $$;

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
