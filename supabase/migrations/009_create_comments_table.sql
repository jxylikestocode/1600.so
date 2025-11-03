-- Comments Table for user feedback
-- Users can leave comments on any page, which are tracked and viewable by admins

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Stores both auth UUIDs and anon_* IDs
  page_path TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  user_email TEXT, -- Optional email for contact
  user_name TEXT, -- Optional name for display
  is_read BOOLEAN DEFAULT false, -- Admin tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_comments_page_path ON comments(page_path);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_is_read ON comments(is_read);
CREATE INDEX idx_comments_page_read ON comments(page_path, is_read);

-- RLS Policies (using service role for admin operations)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert comments (public feedback)
CREATE POLICY "Allow public insert" ON comments
  FOR INSERT
  WITH CHECK (true);

-- Allow public to read their own comments
CREATE POLICY "Allow users to read own comments" ON comments
  FOR SELECT
  USING (true);

-- Comments for admin page RPC function
CREATE OR REPLACE FUNCTION get_all_comments_with_details()
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  page_path TEXT,
  comment_text TEXT,
  user_email TEXT,
  user_name TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.page_path,
    c.comment_text,
    c.user_email,
    c.user_name,
    c.is_read,
    c.created_at,
    c.updated_at
  FROM comments c
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;
