-- Add provider_id for storing external email service ID (e.g., Resend id)
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS provider_id TEXT;


