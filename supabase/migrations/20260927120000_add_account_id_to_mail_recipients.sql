-- Per-recipient sending account, so a campaign can alternate between several accounts.
-- Null means "use the campaign's account_id" (campaigns created before this column).
alter table public.mail_recipients
  add column if not exists account_id uuid references public.mail_accounts(id) on delete set null;

create index if not exists idx_mail_recipients_account_sent on public.mail_recipients(account_id, sent_at);
