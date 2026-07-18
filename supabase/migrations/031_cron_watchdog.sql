-- 031_cron_watchdog.sql
--
-- "Quién vigila al que vigila" — health-check hasta ahora solo revisaba
-- dinero atascado, nunca si los propios crons (incluido el suyo) seguían
-- corriendo de verdad. Si uno deja de ejecutarse un día, hasta ahora
-- nadie se enteraba salvo por casualidad.

create or replace function find_cron_issues()
returns table (
  issue text,
  job_name text,
  detail text
)
language sql
security definer
as $$
  with expected as (
    select 'auto-capture-every-15-min'::text as job_name, interval '30 minutes' as max_gap
    union all select 'health-check-every-30-min', interval '1 hour'
    union all select 'onboarding-reminder-every-6-hours', interval '7 hours'
  ),
  last_success as (
    select
      j.jobname,
      max(jrd.end_time) as last_ok
    from cron.job j
    left join cron.job_run_details jrd
      on jrd.jobid = j.jobid and jrd.status = 'succeeded'
    group by j.jobname
  )
  select
    'cron_not_running' as issue,
    e.job_name,
    coalesce(
      'última corrida exitosa: ' || ls.last_ok::text,
      'nunca ha corrido con éxito'
    ) as detail
  from expected e
  left join last_success ls on ls.jobname = e.job_name
  where ls.last_ok is null or ls.last_ok < now() - e.max_gap;
$$;

-- Verifica después de aplicar:
--   select * from find_cron_issues();
-- Debe devolver vacío en un sistema sano.
