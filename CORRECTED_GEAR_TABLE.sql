-- Corrected Gear Table Migration
-- This follows the same pattern as stack_items, protocols, uploads
-- Run this in your Supabase SQL Editor

-- Drop the incorrect table if it exists
DROP TABLE IF EXISTS gear;

-- Create the gear table with correct profile_id reference
CREATE TABLE gear (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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
COMMENT ON TABLE gear IS 'User gear and equipment showcase - available to all users';
COMMENT ON COLUMN gear.profile_id IS 'References profiles.id (not auth.users.id directly)';
COMMENT ON COLUMN gear.name IS 'Product name (e.g., "WHOOP 4.0", "Pod 4 Ultra")';
COMMENT ON COLUMN gear.brand IS 'Brand name (e.g., "WHOOP", "Eight Sleep")';
COMMENT ON COLUMN gear.model IS 'Model/version (e.g., "4.0", "Gen3", "Pro")';
COMMENT ON COLUMN gear.category IS 'Gear category (Wearables, Recovery, Kitchen, Fitness, Sleep, Other)';
COMMENT ON COLUMN gear.buy_link IS 'Affiliate link for purchasing this gear (Pro feature only)';

-- Create indexes for performance
CREATE INDEX gear_profile_id_idx ON gear(profile_id);
CREATE INDEX gear_category_idx ON gear(category);
CREATE INDEX gear_public_idx ON gear(public);
CREATE INDEX gear_profile_public_idx ON gear(profile_id, public);

-- Enable RLS
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;

-- RLS Policies (following the same pattern as other tables)
CREATE POLICY "Gear is viewable by everyone if public" ON gear
  FOR SELECT USING (public = true);

CREATE POLICY "Users can view gear for their own profiles" ON gear
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert gear for their own profiles" ON gear
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update gear for their own profiles" ON gear
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete gear for their own profiles" ON gear
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_gear_updated_at BEFORE UPDATE ON gear
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test the table
SELECT 'Gear table created successfully with correct profile_id reference!' as status;
