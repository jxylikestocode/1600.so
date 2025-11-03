-- Enhanced RPC function to get user activity summary with username and location
-- Includes LEFT JOINs to preserve all users even without matching data
-- Runs with SECURITY DEFINER to access auth.users

CREATE OR REPLACE FUNCTION get_users_activity_summary_with_details()
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  most_recent_location TEXT,
  total_events BIGINT,
  session_count BIGINT,
  answer_count BIGINT,
  pageview_count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      ae.user_id,
      COUNT(*) AS total_events,
      COUNT(DISTINCT ae.session_id) AS session_count,
      COUNT(*) FILTER (WHERE ae.event_type = 'answer') AS answer_count,
      COUNT(*) FILTER (WHERE ae.event_type = 'pageview') AS pageview_count,
      MAX(ae.created_at) AS last_activity
    FROM analytics_events ae
    GROUP BY ae.user_id
  ),
  most_recent_sessions AS (
    SELECT DISTINCT ON (us.user_id)
      us.user_id,
      us.device_info
    FROM user_sessions us
    INNER JOIN user_stats stats ON stats.user_id = us.user_id
    ORDER BY us.user_id, us.last_activity_at DESC
  )
  SELECT
    stats.user_id::TEXT,
    -- Username: email from auth.users for authenticated, 'Anonymous' for anon users
    COALESCE(
      au.email,
      'Anonymous'
    )::TEXT AS username,
    -- Most recent location: formatted as "City, Region, Country"
    CASE
      WHEN sess.device_info IS NOT NULL
        AND sess.device_info->'location' IS NOT NULL
        AND (sess.device_info->'location'->>'isLocal')::BOOLEAN IS NOT TRUE
      THEN
        CONCAT_WS(', ',
          NULLIF(sess.device_info->'location'->>'city', 'Unknown'),
          NULLIF(sess.device_info->'location'->>'region', 'Unknown'),
          NULLIF(sess.device_info->'location'->>'country', 'Unknown')
        )
      ELSE
        NULL
    END::TEXT AS most_recent_location,
    stats.total_events::BIGINT,
    stats.session_count::BIGINT,
    stats.answer_count::BIGINT,
    stats.pageview_count::BIGINT,
    stats.last_activity
  FROM user_stats stats
  LEFT JOIN most_recent_sessions sess ON stats.user_id = sess.user_id
  LEFT JOIN auth.users au ON stats.user_id = au.id::TEXT
  ORDER BY stats.last_activity DESC;
END;
$$ LANGUAGE plpgsql;
