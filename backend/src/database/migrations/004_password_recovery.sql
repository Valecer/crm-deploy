-- Migration: Add password recovery fields to clients table
-- Date: 2025-01-27
-- Feature: 012-password-recovery

PRAGMA foreign_keys = ON;

-- Add codephrase column to clients table (UNIQUE constraint for codephrase uniqueness)
ALTER TABLE clients ADD COLUMN codephrase TEXT UNIQUE;

-- Add recovery_pending column to clients table (boolean flag for pending recovery requests)
ALTER TABLE clients ADD COLUMN recovery_pending INTEGER NOT NULL DEFAULT 0 CHECK(recovery_pending IN (0, 1));

-- Create index on codephrase for fast lookups during recovery validation
CREATE INDEX IF NOT EXISTS idx_clients_codephrase ON clients(codephrase);

-- Create index on recovery_pending for filtering Companies tab
CREATE INDEX IF NOT EXISTS idx_clients_recovery_pending ON clients(recovery_pending);

-- Note: Existing clients will have codephrase = NULL and recovery_pending = 0
-- Codephrases should be generated for existing clients via admin tool if needed

