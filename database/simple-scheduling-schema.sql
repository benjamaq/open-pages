-- Simple Scheduling Enhancement
-- Add scheduling fields to existing tables only

-- Add scheduling columns to stack_items
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'daily';
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS schedule_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}';
ALTER TABLE stack_items ADD COLUMN IF NOT EXISTS time_preference VARCHAR(20) DEFAULT 'anytime';

-- Add scheduling columns to protocols  
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'weekly';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS schedule_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}';
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS time_preference VARCHAR(20) DEFAULT 'anytime';
