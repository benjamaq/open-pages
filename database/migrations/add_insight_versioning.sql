-- Ensure elli_messages has context jsonb for algorithm metadata
ALTER TABLE elli_messages
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;


