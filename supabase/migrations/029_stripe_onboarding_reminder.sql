-- 029_stripe_onboarding_reminder.sql
--
-- Antes no registrábamos cuándo un restaurante empezó el formulario de
-- Stripe (solo si lo terminó) — así que no había forma de detectar "lo
-- abrió pero se quedó a medias" para mandarle un recordatorio.

alter table public.venues
  add column if not exists stripe_onboarding_started_at timestamptz;

alter table public.venues
  add column if not exists stripe_onboarding_reminder_sent_at timestamptz;

-- Verifica después de aplicar:
--   select name, stripe_onboarding_started_at, stripe_onboarding_reminder_sent_at from venues;

-- Cron — mismo patrón que health-check y auto-capture. Cada 6 horas basta
-- para una ventana de 24-48h, sin ser invasivo.
create or replace function call_onboarding_reminder()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null or v_key is null then
    raise warning '[onboarding-reminder] Vault secrets project_url/service_role_key no configurados — cron sin efecto';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/onboarding-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

select cron.schedule(
  'onboarding-reminder-every-6-hours',
  '0 */6 * * *',
  $$select call_onboarding_reminder();$$
);
