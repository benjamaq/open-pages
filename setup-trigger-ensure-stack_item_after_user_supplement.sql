-- Create trigger to ensure a stack_items row exists after each user_supplement insert
CREATE OR REPLACE FUNCTION ensure_stack_item_after_user_supplement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE pid uuid; nm text;
BEGIN
  SELECT id INTO pid FROM profiles WHERE user_id = NEW.user_id LIMIT 1;
  IF pid IS NULL THEN RETURN NEW; END IF;
  nm := coalesce(
         NEW.name,
         (SELECT canonical_name FROM supplement WHERE id = NEW.supplement_id),
         'Unknown Supplement ' || left(NEW.id::text, 8)
       );
  INSERT INTO stack_items (profile_id, name, monthly_cost, created_at, user_supplement_id)
  VALUES (pid, nm, nullif(NEW.monthly_cost_usd, 0), coalesce(NEW.created_at, now()), NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_user_supplement_stack_item ON user_supplement;
CREATE TRIGGER trg_user_supplement_stack_item
AFTER INSERT ON user_supplement
FOR EACH ROW EXECUTE FUNCTION ensure_stack_item_after_user_supplement();


