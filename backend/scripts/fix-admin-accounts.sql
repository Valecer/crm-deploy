-- Fix Admin Accounts SQL Script
-- Run this script to fix master account status and password issues
-- Usage: sqlite3 database.sqlite < fix-admin-accounts.sql
-- Or: sqlite3 database.sqlite -cmd "SELECT * FROM administrators WHERE login IN ('admin1', 'admin2', 'master1');"

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- First, check current status
SELECT 'Current status:' as info;
SELECT id, login, is_master, 
       CASE WHEN password_hash IS NULL THEN 'NO PASSWORD' ELSE 'HAS PASSWORD' END as password_status
FROM administrators 
WHERE login IN ('admin1', 'admin2', 'master1')
ORDER BY login;

-- Note: Password hashes cannot be set via SQL alone - they need to be generated using bcrypt
-- Use the Node.js script fix-admin-accounts.js to set passwords properly

-- Fix admin1: Set as master
UPDATE administrators 
SET is_master = 1 
WHERE login = 'admin1' AND (is_master = 0 OR is_master IS NULL);

-- Fix admin2: Set as master
UPDATE administrators 
SET is_master = 1 
WHERE login = 'admin2' AND (is_master = 0 OR is_master IS NULL);

-- Fix master1: Ensure master status
UPDATE administrators 
SET is_master = 1 
WHERE login = 'master1' AND (is_master = 0 OR is_master IS NULL);

-- Show final status (password hashes will still need to be set via Node.js script)
SELECT 'Final status after SQL updates:' as info;
SELECT id, login, is_master, 
       CASE WHEN password_hash IS NULL THEN 'NO PASSWORD - RUN fix-admin-accounts.js' ELSE 'HAS PASSWORD' END as password_status
FROM administrators 
WHERE login IN ('admin1', 'admin2', 'master1')
ORDER BY login;

-- IMPORTANT: To fix passwords, you must run:
-- node scripts/fix-admin-accounts.js
-- This will hash and set passwords correctly for admin2 and master1

