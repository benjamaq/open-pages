-- Gear Module Migration
-- Create gear table for showcasing user's equipment and tools
-- Run this ONLY on a test database first!

-- Create the gear table
CREATE TABLE gear (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  category text NOT NULL DEFAULT 'Other',
  description text,
  buy_link text, -- Affiliate link (Pro feature)
  public boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE gear IS 'User gear and equipment showcase';
COMMENT ON COLUMN gear.name IS 'Product name (e.g., "WHOOP 4.0", "Pod 4 Ultra")';
COMMENT ON COLUMN gear.brand IS 'Brand name (e.g., "WHOOP", "Eight Sleep")';
COMMENT ON COLUMN gear.model IS 'Model/version (e.g., "4.0", "Gen3", "Pro")';
COMMENT ON COLUMN gear.category IS 'Gear category (Wearables, Recovery, Kitchen, Fitness, Sleep, Other)';
COMMENT ON COLUMN gear.buy_link IS 'Affiliate link for purchasing this gear (Pro feature)';

-- Create indexes for performance
CREATE INDEX gear_user_id_idx ON gear(user_id);
CREATE INDEX gear_category_idx ON gear(category);
CREATE INDEX gear_public_idx ON gear(public);

-- RLS policies (Row Level Security)
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own gear
CREATE POLICY "Users can view own gear" ON gear
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own gear
CREATE POLICY "Users can insert own gear" ON gear
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own gear
CREATE POLICY "Users can update own gear" ON gear
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own gear
CREATE POLICY "Users can delete own gear" ON gear
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public access to public gear items (for public profiles)
CREATE POLICY "Public gear is viewable by everyone" ON gear
  FOR SELECT USING (public = true);

-- Test data (optional - for development testing)
-- Uncomment these lines to add test data:

-- INSERT INTO gear (name, brand, model, category, description, buy_link, user_id) VALUES 
-- ('WHOOP 4.0', 'WHOOP', '4.0', 'Wearables', '24/7 health tracking', 'https://join.whoop.com/affiliate', 'your-user-id-here'),
-- ('Pod 4 Ultra', 'Eight Sleep', 'Pod 4 Ultra', 'Sleep', 'Smart mattress with temperature control', 'https://eightsleep.com/affiliate', 'your-user-id-here'),
-- ('Oura Ring', 'Oura', 'Gen3', 'Wearables', 'Sleep and recovery tracking', null, 'your-user-id-here');

-- Query to test the new table
-- SELECT name, brand, category, buy_link FROM gear WHERE user_id = 'your-user-id-here';

-- Rollback script (if needed):
-- DROP TABLE IF EXISTS gear;
