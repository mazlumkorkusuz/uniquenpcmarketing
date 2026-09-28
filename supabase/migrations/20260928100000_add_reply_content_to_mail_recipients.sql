-- Content of the recipient's reply, saved by /api/mail-imap-sync and shown in the tracking drawer
ALTER TABLE mail_recipients ADD COLUMN IF NOT EXISTS reply_subject TEXT;
ALTER TABLE mail_recipients ADD COLUMN IF NOT EXISTS reply_body TEXT;
