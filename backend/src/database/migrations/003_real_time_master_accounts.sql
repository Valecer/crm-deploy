-- Migration: Add display_name, is_master, and last_assigned_at to administrators table
-- Date: 2025-01-27
-- Feature: 6-real-time-updates-master

PRAGMA foreign_keys = ON;

-- Add display_name column (nullable initially, will be set for existing records)
ALTER TABLE administrators ADD COLUMN display_name TEXT;

-- Add is_master column (nullable, will be set for existing records)
ALTER TABLE administrators ADD COLUMN is_master INTEGER;

-- Add last_assigned_at column (nullable, tracks last assignment for round-robin)
ALTER TABLE administrators ADD COLUMN last_assigned_at INTEGER;

-- Set display_name = login for all existing administrators
UPDATE administrators SET display_name = login WHERE display_name IS NULL;

-- Set is_master = 0 for all existing administrators (explicit)
UPDATE administrators SET is_master = 0 WHERE is_master IS NULL;

-- Create index on is_master for efficient queries
CREATE INDEX IF NOT EXISTS idx_administrators_is_master ON administrators(is_master);

-- Create index on display_name for efficient queries (if needed for future features)
CREATE INDEX IF NOT EXISTS idx_administrators_display_name ON administrators(display_name);

-- Note: Manual step required after migration:
-- Promote at least 2 administrators to master accounts:
-- UPDATE administrators SET is_master = 1 WHERE id IN ('admin-001', 'admin-002');

