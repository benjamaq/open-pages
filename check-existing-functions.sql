-- Check what functions exist in the database
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%upsert%' OR p.proname LIKE '%daily%'
ORDER BY p.proname;

-- Also check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%daily%' OR table_name LIKE '%mood%'
ORDER BY table_name;
