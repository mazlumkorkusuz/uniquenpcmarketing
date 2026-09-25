-- ============================================================
-- Unique NPC Marketing Dashboard — Mail Servisi Migration
-- Run once in the Supabase SQL Editor
-- ============================================================


-- ============================================================
-- 1. MAIL ACCOUNTS
-- ============================================================

create table if not exists mail_accounts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  smtp_host    text not null,
  smtp_port    integer not null default 587,
  smtp_user    text not null,
  smtp_pass    text not null,
  daily_limit  integer not null default 200,
  sent_today   integer not null default 0,
  logo_url     text,
  banner_url   text,
  domain       text,
  status       text not null default 'active',
  created_at   timestamptz not null default now()
);


-- ============================================================
-- 2. MAIL TEMPLATES
-- ============================================================

create table if not exists mail_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  platform      text,
  tier          text,
  language      text,
  subject       text not null,
  html_content  text not null,
  account_id    uuid references mail_accounts(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index idx_mail_templates_account on mail_templates(account_id);


-- ============================================================
-- 3. MAIL CAMPAIGNS
-- ============================================================

create table if not exists mail_campaigns (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  template_id       uuid references mail_templates(id) on delete set null,
  account_id        uuid references mail_accounts(id) on delete set null,
  status            text not null default 'draft',
  total_recipients  integer not null default 0,
  sent_count        integer not null default 0,
  open_count        integer not null default 0,
  reply_count       integer not null default 0,
  bounce_count      integer not null default 0,
  delay_seconds     integer not null default 30,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  completed_at      timestamptz
);

create index idx_mail_campaigns_status on mail_campaigns(status);


-- ============================================================
-- 4. MAIL RECIPIENTS
-- ============================================================

create table if not exists mail_recipients (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references mail_campaigns(id) on delete cascade,
  email        text not null,
  name         text,
  platform     text,
  followers    integer,
  language     text,
  status       text not null default 'pending',
  sent_at      timestamptz,
  opened_at    timestamptz,
  open_count   integer not null default 0,
  replied_at   timestamptz,
  bounced_at   timestamptz,
  bounce_type  text,
  created_at   timestamptz not null default now()
);

create index idx_mail_recipients_campaign on mail_recipients(campaign_id);
create index idx_mail_recipients_status   on mail_recipients(campaign_id, status);
create index idx_mail_recipients_email    on mail_recipients(email);


-- ============================================================
-- 5. MAIL TRACKING LOGS
-- ============================================================

create table if not exists mail_tracking_logs (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid references mail_campaigns(id) on delete cascade,
  recipient_id  uuid references mail_recipients(id) on delete cascade,
  email         text,
  event         text not null,
  ip            text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index idx_mail_tracking_campaign  on mail_tracking_logs(campaign_id);
create index idx_mail_tracking_recipient on mail_tracking_logs(recipient_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table mail_accounts       enable row level security;
alter table mail_templates      enable row level security;
alter table mail_campaigns      enable row level security;
alter table mail_recipients     enable row level security;
alter table mail_tracking_logs  enable row level security;


-- ============================================================
-- RLS POLICIES — authenticated users have full access
-- (The server-side service-role key bypasses RLS automatically)
-- ============================================================

do $$
declare
  tbl  text;
  pname text;
  tables text[] := array[
    'mail_accounts','mail_templates','mail_campaigns',
    'mail_recipients','mail_tracking_logs'
  ];
begin
  foreach tbl in array tables loop
    pname := 'auth_all_' || tbl;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = tbl
        and policyname = pname
    ) then
      execute format(
        $pol$create policy %I on %I
             for all to authenticated
             using (true) with check (true)$pol$,
        pname, tbl
      );
    end if;
  end loop;
end $$;

-- Tracking pixel / link redirects are hit by anonymous recipients
drop policy if exists anon_insert_mail_tracking_logs on mail_tracking_logs;
create policy anon_insert_mail_tracking_logs on mail_tracking_logs
  for insert to anon
  with check (true);


-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

create or replace function increment_campaign_sent(cid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update mail_campaigns
     set sent_count = sent_count + 1
   where id = cid;
$$;

create or replace function increment_campaign_opens(cid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update mail_campaigns
     set open_count = open_count + 1
   where id = cid;
$$;
