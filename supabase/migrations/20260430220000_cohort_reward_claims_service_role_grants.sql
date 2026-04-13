-- cohort_reward_claims had RLS enabled with no policies; service_role should bypass RLS, but
-- explicit grants avoid edge cases where PostgREST inserts from the service key fail.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cohort_reward_claims TO service_role;
