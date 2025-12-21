-- Add additional noise factor columns to checkin table
ALTER TABLE checkin
ADD COLUMN IF NOT EXISTS intense_exercise BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS new_supplement BOOLEAN DEFAULT FALSE;


