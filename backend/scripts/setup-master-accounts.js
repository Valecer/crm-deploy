/**
 * Setup Master Accounts Script
 * Applies migration and promotes administrators to master accounts
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'database.sqlite');
const MIGRATION_PATH = join(__dirname, '..', 'src', 'database', 'migrations', '003_real_time_master_accounts.sql');

async function setupMasterAccounts() {
  console.log('Setting up master accounts...\n');
  
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

    // Check if migration columns already exist
    const tableInfo = await db.all("PRAGMA table_info(administrators)");
    const hasDisplayName = tableInfo.some(col => col.name === 'display_name');
    const hasIsMaster = tableInfo.some(col => col.name === 'is_master');
    
    // Apply migration if needed
    if (!hasDisplayName || !hasIsMaster) {
      console.log('Applying migration: 003_real_time_master_accounts.sql');
      const migrationSQL = await readFile(MIGRATION_PATH, 'utf-8');
      await db.exec(migrationSQL);
      console.log('✓ Migration applied successfully\n');
    } else {
      console.log('✓ Migration already applied\n');
    }

    // Get all administrators
    const admins = await db.all('SELECT id, login, display_name, is_master FROM administrators ORDER BY id');
    
    if (admins.length === 0) {
      console.log('⚠ No administrators found in database.');
      console.log('Please seed the database first by starting the backend server.');
      return;
    }

    console.log(`Found ${admins.length} administrator(s):`);
    admins.forEach(admin => {
      console.log(`  - ${admin.login} (${admin.id}) - ${admin.is_master ? 'MASTER' : 'Regular'}`);
    });
    console.log('');

    // Count existing masters
    const masterCount = admins.filter(a => a.is_master === 1).length;
    
    if (masterCount < 2) {
      console.log(`Promoting administrators to master accounts (need at least 2, currently: ${masterCount})...`);
      
      // Promote first 2 admins to master (or however many needed to reach 2)
      const adminsToPromote = admins.slice(0, Math.max(2 - masterCount, 0));
      
      for (const admin of adminsToPromote) {
        await db.run(
          'UPDATE administrators SET is_master = 1 WHERE id = ?',
          [admin.id]
        );
        console.log(`  ✓ Promoted ${admin.login} (${admin.id}) to master account`);
      }
      console.log('');
    } else {
      console.log(`✓ Master accounts already configured (${masterCount} master(s) found)\n`);
    }

    // Display final credentials
    const finalAdmins = await db.all(`
      SELECT id, login, display_name, is_master 
      FROM administrators 
      ORDER BY is_master DESC, id ASC
    `);

    console.log('═══════════════════════════════════════════════════════');
    console.log('         ADMINISTRATOR CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('Master Accounts (can manage admins and assign tickets):');
    const masters = finalAdmins.filter(a => a.is_master === 1);
    masters.forEach((admin, index) => {
      const displayName = admin.display_name || admin.login;
      console.log(`  ${index + 1}. Login: ${admin.login}`);
      console.log(`     Display Name: ${displayName}`);
      console.log(`     Password: admin123`);
      console.log(`     Type: MASTER ACCOUNT`);
      console.log('');
    });

    if (masters.length === 0) {
      console.log('  ⚠ No master accounts found!\n');
    }

    console.log('Regular Accounts (can manage tickets only):');
    const regulars = finalAdmins.filter(a => a.is_master === 0);
    regulars.forEach((admin, index) => {
      const displayName = admin.display_name || admin.login;
      console.log(`  ${index + 1}. Login: ${admin.login}`);
      console.log(`     Display Name: ${displayName}`);
      console.log(`     Password: admin123`);
      console.log(`     Type: Regular Administrator`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('\n✓ Master accounts setup complete!');
    console.log('\n💡 Tip: You can change passwords and display names after logging in.');

  } catch (error) {
    console.error('\n❌ Error setting up master accounts:', error.message);
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
setupMasterAccounts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

