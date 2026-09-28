CREATE TABLE IF NOT EXISTS mail_reply_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES mail_recipients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES mail_campaigns(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ,
  subject TEXT,
  body_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mail_reply_logs_recipient_id_idx ON mail_reply_logs(recipient_id);
CREATE INDEX IF NOT EXISTS mail_reply_logs_campaign_id_idx ON mail_reply_logs(campaign_id);
