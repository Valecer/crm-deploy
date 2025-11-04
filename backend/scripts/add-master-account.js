/**
 * Add Master Account Script
 * Adds a new master account to the database
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { hashPassword } from '../src/services/auth.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'database.sqlite');

async function addMasterAccount(login, password) {
  console.log(`Adding master account: ${login}\n`);
  
  let db;
  try {
    // Open database
    console.log(`Opening database: ${DB_PATH}`);
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    // Check if login already exists
    const existing = await db.get(
      'SELECT id, login FROM administrators WHERE login = ?',
      [login]
    );

    if (existing) {
      console.log(`❌ Error: Administrator with login "${login}" already exists (ID: ${existing.id})`);
      console.log('   Use a different login or update the existing account.');
      process.exit(1);
    }

    // Find next available admin ID
    const existingAdmins = await db.all(
      "SELECT id FROM administrators WHERE id LIKE 'admin-%' ORDER BY CAST(SUBSTR(id, 7) AS INTEGER) DESC LIMIT 1"
    );
    
    let nextId = 'admin-006'; // Default if no admins exist
    if (existingAdmins.length > 0) {
      const lastId = existingAdmins[0].id;
      const match = lastId.match(/^admin-(\d+)$/);
      if (match) {
        const lastNum = parseInt(match[1], 10);
        const nextNum = lastNum + 1;
        nextId = `admin-${nextNum.toString().padStart(3, '0')}`;
      }
    }

    // Check if migration columns exist
    const tableInfo = await db.all("PRAGMA table_info(administrators)");
    const hasDisplayName = tableInfo.some(col => col.name === 'display_name');
    const hasIsMaster = tableInfo.some(col => col.name === 'is_master');

    if (!hasDisplayName || !hasIsMaster) {
      console.log('⚠ Warning: Migration columns not found. Run migrations first.');
      console.log('   You may need to start the backend server to apply migrations.');
      process.exit(1);
    }

    // Hash password
    console.log('Hashing password...');
    const passwordHash = await hashPassword(password);

    // Insert new administrator as master account
    const now = Math.floor(Date.now() / 1000);
    await db.run(
      `INSERT INTO administrators (id, login, password_hash, display_name, is_master, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nextId, login, passwordHash, login, 1, now]
    );

    console.log('\n✅ Master account created successfully!');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('         NEW MASTER ACCOUNT CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`  Login: ${login}`);
    console.log(`  Password: ${password}`);
    console.log(`  Display Name: ${login}`);
    console.log(`  ID: ${nextId}`);
    console.log(`  Type: MASTER ACCOUNT`);
    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error adding master account:', error.message);
    if (error.code === 'SQLITE_CANTOPEN') {
      console.error('\n⚠ Database file not found. Please start the backend server first to create it.');
    } else if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error('\n⚠ Login already exists. Use a different login.');
    }
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

// Get command line arguments
const args = process.argv.slice(2);

// Default values for quick setup
const DEFAULT_LOGIN = 'master1';
const DEFAULT_PASSWORD = 'master 123';

let login, password;

if (args.length < 2) {
  // Use defaults if not provided
  login = DEFAULT_LOGIN;
  password = DEFAULT_PASSWORD;
  console.log(`Using default values: login="${login}", password="${password}"`);
} else {
  [login, password] = args;
}

// Validate login
if (!login || login.trim().length === 0) {
  console.error('❌ Error: Login cannot be empty');
  process.exit(1);
}

if (login.length > 50) {
  console.error('❌ Error: Login must be 50 characters or less');
  process.exit(1);
}

// Validate password
if (!password || password.trim().length === 0) {
  console.error('❌ Error: Password cannot be empty');
  process.exit(1);
}

// Run the script
addMasterAccount(login.trim(), password.trim()).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

