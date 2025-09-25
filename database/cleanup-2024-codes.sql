-- Cleanup 2024 Beta Codes
-- Run this in your Supabase SQL editor to remove old 2024 codes

-- Delete all 2024 beta codes
DELETE FROM beta_codes 
WHERE code LIKE 'BETA2024-%';

-- Verify cleanup
SELECT COUNT(*) as remaining_2024_codes
FROM beta_codes 
WHERE code LIKE 'BETA2024-%';

-- Show current codes (should only be 2025)
SELECT code, created_at, used_by, used_at, expires_at
FROM beta_codes 
ORDER BY code;
