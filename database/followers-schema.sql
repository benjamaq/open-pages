-- Create followers table for stack following functionality
CREATE TABLE IF NOT EXISTS stack_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_email TEXT NOT NULL,
  follower_name TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_user_id, follower_email)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stack_followers_owner ON stack_followers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stack_followers_email ON stack_followers(follower_email);

-- Enable RLS
ALTER TABLE stack_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own followers" ON stack_followers
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert followers for their own stack" ON stack_followers
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own followers" ON stack_followers
  FOR UPDATE USING (owner_user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_stack_followers_updated_at
    BEFORE UPDATE ON stack_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
