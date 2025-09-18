-- Quick fix to add item_type column to stack_items table
-- This will allow proper separation of supplements, mindfulness, movement, etc.

-- Add the item_type column if it doesn't exist
ALTER TABLE stack_items 
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'supplements';

-- Update existing items to have a default type
-- (You can manually update specific items later if needed)
UPDATE stack_items 
SET item_type = 'supplements' 
WHERE item_type IS NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_stack_items_item_type 
ON stack_items(item_type);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stack_items' 
AND column_name = 'item_type';
