-- Create view for active game sessions with JOIN optimizations
-- This view provides a denormalized view of active sessions with related data
-- pre-joined for efficient querying

CREATE VIEW active_game_sessions AS
SELECT
  gs.id AS session_id,
  gs.game_type,
  gs.status,
  gs.max_players,
  gs.current_players,
  gs.created_at,
  gs.started_at,
  gs.event_id,
  
  -- Host information
  gs.host_id,
  h.username AS host_username,
  h.first_name AS host_first_name,
  h.email AS host_email,
  h.profile_image_url AS host_profile_image,
  
  -- Co-host information
  gs.co_host_id,
  ch.username AS co_host_username,
  ch.first_name AS co_host_first_name,
  
  -- Community information
  gs.community_id,
  c.name AS community_name,
  c.display_name AS community_display_name,
  c.theme_color AS community_theme_color,
  
  -- Event information (if linked)
  e.title AS event_title,
  e.start_time AS event_start_time,
  
  -- Game data extracts (SQLite JSON functions)
  json_extract(gs.game_data, '$.name') AS game_name,
  json_extract(gs.game_data, '$.format') AS game_format,
  json_extract(gs.game_data, '$.description') AS game_description,
  
  -- Calculated fields
  (gs.max_players - gs.current_players) AS slots_available,
  CASE 
    WHEN gs.current_players >= gs.max_players THEN 'full'
    WHEN gs.status = 'waiting' THEN 'open'
    WHEN gs.status = 'active' THEN 'in_progress'
    ELSE gs.status
  END AS session_state

FROM game_sessions gs

-- JOIN with host user
INNER JOIN users h ON gs.host_id = h.id

-- LEFT JOIN with co-host (may not exist)
LEFT JOIN users ch ON gs.co_host_id = ch.id

-- LEFT JOIN with community (may not exist)
LEFT JOIN communities c ON gs.community_id = c.id

-- LEFT JOIN with event (may not exist)
LEFT JOIN events e ON gs.event_id = e.id

-- Only include active and waiting sessions
WHERE gs.status IN ('waiting', 'active', 'paused');

-- Note: This view can be queried with WHERE clauses that will use the underlying
-- indexes on game_sessions table:
-- 
-- Examples:
--   SELECT * FROM active_game_sessions WHERE community_id = 'xyz';
--     -> Uses idx_game_sessions_community_status index
--
--   SELECT * FROM active_game_sessions WHERE host_id = 'abc' AND status = 'waiting';
--     -> Uses idx_game_sessions_host_status index
--     Note: Use 'status' column (not 'session_state') to leverage the index
--
--   SELECT * FROM active_game_sessions WHERE community_id = 'xyz' ORDER BY created_at DESC;
--     -> Uses idx_game_sessions_community_status_created index
