-- Add domain column to user_answers table
-- This allows us to group skills by domain (e.g., Algebra, Geometry, Information and Ideas)

-- Add the column
ALTER TABLE user_answers
ADD COLUMN question_domain TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_answers_domain ON user_answers(question_domain);

-- Optional: Backfill existing data with domain information
-- This would require joining with your question data source
-- For now, existing records will have NULL domain, which we can handle in the UI
-- New answers will include domain when saved

COMMENT ON COLUMN user_answers.question_domain IS 'The domain/category of the question (e.g., Algebra, Geometry, Information and Ideas). Corresponds to primary_class_cd_desc in question metadata.';
