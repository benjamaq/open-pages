-- Notifications and Email Preferences Schema

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  daily_reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'UTC',
  supplements_reminder BOOLEAN DEFAULT true,
  protocols_reminder BOOLEAN DEFAULT true,
  movement_reminder BOOLEAN DEFAULT true,
  mindfulness_reminder BOOLEAN DEFAULT true,
  missed_items_reminder BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Notification queue for scheduled emails
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'daily_reminder', 'missed_items', 'weekly_summary'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  email_data JSONB NOT NULL, -- Contains email content, recipient, etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily completion tracking (enhanced)
CREATE TABLE IF NOT EXISTS daily_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL, -- References stack_items, protocols, etc.
  item_type TEXT NOT NULL, -- 'supplement', 'protocol', 'movement', 'mindfulness'
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reminder_sent BOOLEAN DEFAULT false,
  UNIQUE(profile_id, item_id, completed_date)
);

-- Email delivery log
CREATE TABLE IF NOT EXISTS email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
  provider_id TEXT, -- External email service ID
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_profile ON notification_queue(profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_completions_profile_date ON daily_completions(profile_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_email_log_profile ON email_log(profile_id);

-- RLS Policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Users can only access their own notification data
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR UPDATE USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own daily completions" ON daily_completions
  FOR ALL USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own email log" ON email_log
  FOR SELECT USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Service role can manage notification queue and email log
CREATE POLICY "Service role can manage notification queue" ON notification_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email log" ON email_log
  FOR ALL USING (auth.role() = 'service_role');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_notification_preferences_on_profile
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();
