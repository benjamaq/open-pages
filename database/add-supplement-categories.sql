-- Add categories column to stack_items table
ALTER TABLE stack_items
  ADD COLUMN categories TEXT[] DEFAULT ARRAY['General'];

-- Update existing records to have the default category
UPDATE stack_items 
SET categories = ARRAY['General'] 
WHERE categories IS NULL OR categories = ARRAY[]::TEXT[];
