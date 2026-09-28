-- Last send error for a recipient (SMTP rejection, account/login problem…), shown on the campaign
-- detail page. Written by scripts/send-campaign.js; cleared when a later attempt succeeds.
alter table public.mail_recipients
  add column if not exists error_message text;
