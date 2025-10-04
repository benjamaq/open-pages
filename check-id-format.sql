-- Check the actual ID format in your database
SELECT id, name, item_type, LENGTH(id::text) as id_length
FROM stack_items 
LIMIT 5;

SELECT id, name, LENGTH(id::text) as id_length
FROM protocols 
LIMIT 5;
