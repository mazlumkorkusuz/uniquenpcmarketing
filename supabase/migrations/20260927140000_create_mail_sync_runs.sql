-- One row per inbox sync (manual button or the 15-minute Railway cron), so the tracking page can
-- show "Son senkronizasyon: X dakika önce".
create table if not exists public.mail_sync_runs (
  id        uuid primary key default gen_random_uuid(),
  ran_at    timestamptz not null default now(),
  trigger   text not null default 'manual',   -- 'manual' | 'cron'
  replies   integer not null default 0,
  bounces   integer not null default 0,
  details   jsonb
);

create index if not exists idx_mail_sync_runs_ran_at on public.mail_sync_runs(ran_at desc);

alter table public.mail_sync_runs enable row level security;

drop policy if exists auth_all_mail_sync_runs on public.mail_sync_runs;
create policy auth_all_mail_sync_runs on public.mail_sync_runs
  for all to authenticated
  using (true) with check (true);
