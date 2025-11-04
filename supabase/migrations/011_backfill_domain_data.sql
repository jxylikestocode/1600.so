-- Backfill domain data for existing user_answers
-- This script updates the question_domain field based on question data

-- First, let's see what we're working with
-- SELECT COUNT(*) FROM user_answers WHERE question_domain IS NULL;

-- We need to update based on the question data
-- Since we don't have a questions table in the database, we'll need to do this via the application layer
-- But we can prepare the structure here

-- For now, this migration creates a function that can be called from the app
-- to update a specific question's domain across all answers

CREATE OR REPLACE FUNCTION update_question_domain(
  p_question_id TEXT,
  p_domain TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_answers
  SET question_domain = p_domain
  WHERE question_id = p_question_id
    AND question_domain IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION update_question_domain IS 'Updates the domain for all answers to a specific question. Used for backfilling domain data.';

-- Create a function to bulk update domains from a JSONB array
CREATE OR REPLACE FUNCTION bulk_update_question_domains(
  question_domains JSONB
)
RETURNS TABLE(q_id TEXT, updated_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  item JSONB;
  update_count INTEGER;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(question_domains)
  LOOP
    UPDATE user_answers
    SET question_domain = item->>'domain'
    WHERE user_answers.question_id = item->>'questionId'
      AND user_answers.question_domain IS NULL;

    GET DIAGNOSTICS update_count = ROW_COUNT;

    IF update_count > 0 THEN
      q_id := item->>'questionId';
      updated_count := update_count;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION bulk_update_question_domains IS 'Bulk updates domains for multiple questions. Input format: [{"questionId": "abc123", "domain": "Algebra"}, ...]';
