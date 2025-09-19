-- Affiliate Feature Migration - Simplified Version
-- Add buy_link column to stack_items table
-- Run this ONLY on a test database first!

-- Add the buy_link column
ALTER TABLE stack_items 
ADD COLUMN buy_link text;

-- Add a comment for documentation
COMMENT ON COLUMN stack_items.buy_link IS 'Affiliate link for purchasing this supplement (Pro feature)';

-- Note: brand column already exists in stack_items table (line 19 in AddStackItemForm.tsx)
-- If for some reason it doesn't exist, uncomment this line:
-- ALTER TABLE stack_items ADD COLUMN brand text;

-- Test data (optional - for development testing)
-- Uncomment these lines to add test data:

-- INSERT INTO stack_items (name, buy_link, user_id) VALUES 
-- ('Test Creatine', 'https://amazon.com/dp/B08TEST1', 'your-user-id-here'),
-- ('Test Vitamin D', 'https://iherb.com/test-vitamin-d', 'your-user-id-here'),
-- ('Test Magnesium', null, 'your-user-id-here'); -- No affiliate link

-- Query to test the new column
-- SELECT name, buy_link FROM stack_items WHERE user_id = 'your-user-id-here';

-- Rollback script (if needed):
-- ALTER TABLE stack_items DROP COLUMN buy_link;
