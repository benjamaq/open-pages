-- Daily Updates Feature Database Schema

-- Daily updates table for "Share Today's Update" feature
CREATE TABLE IF NOT EXISTS daily_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
  mood_label TEXT,
  wearable_sleep_score INTEGER CHECK (wearable_sleep_score >= 0 AND wearable_sleep_score <= 100),
  wearable_recovery INTEGER CHECK (wearable_recovery >= 0 AND wearable_recovery <= 100),
  wearable_source TEXT,
  included_items JSONB DEFAULT '[]'::jsonb,
  note TEXT,
  share_slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Share analytics table
CREATE TABLE IF NOT EXISTS daily_update_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id UUID NOT NULL REFERENCES daily_updates(id) ON DELETE CASCADE,
  share_target TEXT NOT NULL, -- 'copy', 'twitter', 'facebook', 'linkedin', 'download_image'
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_updates_user_date ON daily_updates(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_updates_share_slug ON daily_updates(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_update_shares_update ON daily_update_shares(daily_update_id);
CREATE INDEX IF NOT EXISTS idx_daily_update_shares_target ON daily_update_shares(share_target, shared_at DESC);

-- RLS Policies
ALTER TABLE daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_update_shares ENABLE ROW LEVEL SECURITY;

-- Users can manage their own daily updates
CREATE POLICY "Users can view own daily updates" ON daily_updates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily updates" ON daily_updates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily updates" ON daily_updates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own daily updates" ON daily_updates
  FOR DELETE USING (user_id = auth.uid());

-- Anyone can view shared daily updates (for public links)
CREATE POLICY "Anyone can view shared daily updates" ON daily_updates
  FOR SELECT USING (share_slug IS NOT NULL);

-- Users can view their own share analytics
CREATE POLICY "Users can view own share analytics" ON daily_update_shares
  FOR SELECT USING (
    daily_update_id IN (
      SELECT id FROM daily_updates WHERE user_id = auth.uid()
    )
  );

-- Service role can manage share analytics
CREATE POLICY "Service role can manage share analytics" ON daily_update_shares
  FOR ALL USING (auth.role() = 'service_role');

-- Triggers for updated_at
CREATE TRIGGER update_daily_updates_updated_at
    BEFORE UPDATE ON daily_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique share slug
CREATE OR REPLACE FUNCTION generate_share_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's update for a user
CREATE OR REPLACE FUNCTION get_or_create_today_update(p_user_id UUID)
RETURNS daily_updates AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  existing_update daily_updates;
BEGIN
  -- Try to get existing update for today
  SELECT * INTO existing_update
  FROM daily_updates
  WHERE user_id = p_user_id AND date = today_date;
  
  -- If doesn't exist, create it
  IF existing_update IS NULL THEN
    INSERT INTO daily_updates (user_id, date, energy_score)
    VALUES (p_user_id, today_date, 7)
    RETURNING * INTO existing_update;
  END IF;
  
  RETURN existing_update;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
