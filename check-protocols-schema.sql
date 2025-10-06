-- Check the actual schema of the protocols table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'protocols' 
ORDER BY ordinal_position;
