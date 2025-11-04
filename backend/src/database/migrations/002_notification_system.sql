-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Notification Events Table
-- Tracks events that need to trigger notifications
CREATE TABLE IF NOT EXISTS notification_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK(user_role IN ('client', 'administrator')),
  event_type TEXT NOT NULL CHECK(event_type IN ('new_message', 'ticket_created', 'ticket_status_changed', 'ticket_assigned', 'ticket_completion_updated')),
  entity_id TEXT NOT NULL,
  entity_data TEXT NOT NULL, -- JSON data
  created_at INTEGER NOT NULL,
  read_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_notification_events_user_id_role_created ON notification_events(user_id, user_role, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_events_user_id_role_read ON notification_events(user_id, user_role, read_at);
CREATE INDEX IF NOT EXISTS idx_notification_events_created_at ON notification_events(created_at);

-- User Notification Preferences Table
-- Stores user preferences for sound notifications
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK(user_role IN ('client', 'administrator')),
  sound_enabled INTEGER NOT NULL DEFAULT 1 CHECK(sound_enabled IN (0, 1)),
  sound_volume INTEGER NOT NULL DEFAULT 80 CHECK(sound_volume >= 0 AND sound_volume <= 100),
  notification_types TEXT NOT NULL DEFAULT '["new_message", "ticket_status_changed", "new_ticket"]', -- JSON array
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, user_role)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id_role ON user_notification_preferences(user_id, user_role);

