-- Contact Submissions Table
-- This table stores contact form submissions from users

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'support', 'billing', 'feature', 'bug', 'partnership', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_category ON contact_submissions(category);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own submissions
CREATE POLICY "Users can view own contact submissions" ON contact_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert new submissions
CREATE POLICY "Users can insert contact submissions" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Users can update their own submissions (for status updates, etc.)
CREATE POLICY "Users can update own contact submissions" ON contact_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all submissions (you'll need to create an admin role)
-- CREATE POLICY "Admins can view all contact submissions" ON contact_submissions
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Insert some sample data for testing (optional)
-- INSERT INTO contact_submissions (name, email, subject, category, message, status) VALUES
-- ('John Doe', 'john@example.com', 'Test Subject', 'general', 'This is a test message', 'new'),
-- ('Jane Smith', 'jane@example.com', 'Feature Request', 'feature', 'I would like to see a new feature', 'new');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON contact_submissions TO authenticated;
