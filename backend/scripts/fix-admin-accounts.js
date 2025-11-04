/**
 * Fix Admin Accounts Script
 * Fixes master account status and password issues for admin1, admin2, and master1
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { hashPassword } from '../src/services/auth.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'database.sqlite');

async function fixAdminAccounts() {
  console.log('Fixing administrator accounts...\n');
  
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

    // Check if migration columns exist
    const tableInfo = await db.all("PRAGMA table_info(administrators)");
    const hasIsMaster = tableInfo.some(col => col.name === 'is_master');
    
    if (!hasIsMaster) {
      console.log('⚠ Migration not yet applied. Please start the backend server first to run migrations.');
      return;
    }

    // Show current state
    console.log('Current account status:\n');
    const beforeAdmins = await db.all(`
      SELECT 
        id, 
        login, 
        is_master,
        CASE WHEN password_hash IS NULL THEN 'NO' ELSE 'YES' END as has_password
      FROM administrators 
      WHERE login IN ('admin1', 'admin2', 'master1')
      ORDER BY login
    `);

    beforeAdmins.forEach(admin => {
      console.log(`  ${admin.login}: Master=${admin.is_master === 1 ? 'YES' : 'NO'}, HasPassword=${admin.has_password}`);
    });
    console.log('');

    // Fix admin1 - set as master
    console.log('Fixing admin1: Setting as master account...');
    const admin1 = await db.get('SELECT id, login FROM administrators WHERE login = ?', ['admin1']);
    if (admin1) {
      await db.run('UPDATE administrators SET is_master = 1 WHERE id = ?', [admin1.id]);
      console.log(`  ✓ admin1 (${admin1.id}) is now a master account`);
    } else {
      console.log('  ⚠ admin1 not found');
    }

    // Fix admin2 - set as master and ensure password
    console.log('\nFixing admin2: Setting as master account and password...');
    const admin2 = await db.get('SELECT id, login, password_hash FROM administrators WHERE login = ?', ['admin2']);
    if (admin2) {
      // Set as master
      await db.run('UPDATE administrators SET is_master = 1 WHERE id = ?', [admin2.id]);
      console.log(`  ✓ admin2 (${admin2.id}) is now a master account`);
      
      // Fix password if missing
      if (!admin2.password_hash) {
        console.log('  ⚠ admin2 has no password hash, setting password to "admin123"...');
        const passwordHash = await hashPassword('admin123');
        await db.run('UPDATE administrators SET password_hash = ? WHERE id = ?', [passwordHash, admin2.id]);
        console.log('  ✓ Password set for admin2');
      } else {
        console.log('  ✓ admin2 already has a password hash');
      }
    } else {
      console.log('  ⚠ admin2 not found');
    }

    // Fix master1 - ensure password exists
    console.log('\nFixing master1: Ensuring master status and password...');
    const master1 = await db.get('SELECT id, login, is_master, password_hash FROM administrators WHERE login = ?', ['master1']);
    if (master1) {
      // Ensure master status
      if (master1.is_master !== 1) {
        await db.run('UPDATE administrators SET is_master = 1 WHERE id = ?', [master1.id]);
        console.log(`  ✓ master1 (${master1.id}) is now a master account`);
      } else {
        console.log(`  ✓ master1 (${master1.id}) is already a master account`);
      }
      
      // Fix password if missing
      if (!master1.password_hash) {
        console.log('  ⚠ master1 has no password hash, setting password to "master 123"...');
        const passwordHash = await hashPassword('master 123');
        await db.run('UPDATE administrators SET password_hash = ? WHERE id = ?', [passwordHash, master1.id]);
        console.log('  ✓ Password set for master1');
      } else {
        console.log('  ✓ master1 already has a password hash');
      }
    } else {
      console.log('  ⚠ master1 not found');
    }

    // Show final state
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('         FINAL ACCOUNT STATUS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const afterAdmins = await db.all(`
      SELECT 
        id, 
        login, 
        is_master,
        CASE WHEN password_hash IS NULL THEN 'NO' ELSE 'YES' END as has_password,
        display_name
      FROM administrators 
      WHERE login IN ('admin1', 'admin2', 'master1')
      ORDER BY login
    `);

    afterAdmins.forEach(admin => {
      const displayName = admin.display_name || admin.login;
      console.log(`${admin.login} (${admin.id}):`);
      console.log(`  Master Account: ${admin.is_master === 1 ? 'YES ✓' : 'NO ✗'}`);
      console.log(`  Has Password: ${admin.has_password}`);
      console.log(`  Display Name: ${displayName}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('\n✅ Account fixes complete!\n');
    console.log('Credentials:');
    console.log('  admin1 / admin123 (MASTER)');
    console.log('  admin2 / admin123 (MASTER)');
    console.log('  master1 / master 123 (MASTER)\n');

  } catch (error) {
    console.error('\n❌ Error fixing accounts:', error.message);
    if (error.code === 'SQLITE_CANTOPEN') {
      console.error('\n⚠ Database file not found. Please start the backend server first to create it.');
    }
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

// Run the script
fixAdminAccounts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

