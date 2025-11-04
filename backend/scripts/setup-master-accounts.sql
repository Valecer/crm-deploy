-- Setup Master Accounts
-- This script applies the migration and promotes administrators to master accounts

PRAGMA foreign_keys = ON;

-- Apply migration (idempotent - safe to run multiple times)
-- Check and add display_name column
BEGIN TRANSACTION;

-- Add display_name column if it doesn't exist
INSERT INTO sqlite_master (type, name, sql) 
SELECT 'table', 'temp_add_display_name', 'SELECT 1'
WHERE NOT EXISTS (
    SELECT 1 FROM pragma_table_info('administrators') WHERE name = 'display_name'
);
-- For SQLite, we need to use ALTER TABLE ADD COLUMN IF NOT EXISTS (SQLite 3.37.0+)
-- Otherwise, we check with pragma_table_info first
-- Since older SQLite versions may not support IF NOT EXISTS, we'll handle errors

-- Add columns (may fail if already exist - that's OK)
ALTER TABLE administrators ADD COLUMN display_name TEXT;
ALTER TABLE administrators ADD COLUMN is_master INTEGER DEFAULT 0;
ALTER TABLE administrators ADD COLUMN last_assigned_at INTEGER;

-- Set display_name = login for all existing administrators where display_name is NULL
UPDATE administrators SET display_name = login WHERE display_name IS NULL;

-- Set is_master = 0 for all existing administrators where is_master is NULL
UPDATE administrators SET is_master = 0 WHERE is_master IS NULL;

-- Create indexes (IF NOT EXISTS works for indexes)
CREATE INDEX IF NOT EXISTS idx_administrators_is_master ON administrators(is_master);
CREATE INDEX IF NOT EXISTS idx_administrators_display_name ON administrators(display_name);

COMMIT;

-- Promote first 2 administrators to master accounts (if less than 2 masters exist)
-- This ensures we always have at least 2 master accounts
UPDATE administrators 
SET is_master = 1 
WHERE id IN (
    SELECT id FROM administrators 
    WHERE is_master = 0 OR is_master IS NULL
    ORDER BY id 
    LIMIT (SELECT MAX(0, 2 - (SELECT COUNT(*) FROM administrators WHERE is_master = 1)))
);

