-- Add status column to gear table for past/current tracking
-- Run this AFTER running CORRECTED_GEAR_TABLE.sql

-- Add status column to track current vs past gear
ALTER TABLE gear ADD COLUMN status text NOT NULL DEFAULT 'current';

-- Add comment for documentation
COMMENT ON COLUMN gear.status IS 'Gear status: "current" (actively using) or "past" (previously used)';

-- Create index for filtering by status
CREATE INDEX gear_status_idx ON gear(status);
CREATE INDEX gear_profile_status_idx ON gear(profile_id, status);

-- Test the column addition
SELECT 'Gear status column added successfully!' as status;
