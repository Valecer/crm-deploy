/**
 * Check Administrators Script
 * Quick diagnostic tool to check admin accounts
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'database.sqlite');

async function checkAdmins() {
  let db;
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    const admins = await db.all(`
      SELECT 
        id, 
        login, 
        is_master,
        CASE WHEN password_hash IS NULL THEN 'NO' ELSE 'YES' END as has_password,
        display_name
      FROM administrators 
      ORDER BY login
    `);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('         ADMINISTRATOR ACCOUNT STATUS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    admins.forEach(admin => {
      console.log(`Login: ${admin.login}`);
      console.log(`  ID: ${admin.id}`);
      console.log(`  Master Account: ${admin.is_master === 1 ? 'YES' : 'NO'}`);
      console.log(`  Has Password: ${admin.has_password}`);
      console.log(`  Display Name: ${admin.display_name || admin.login}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

checkAdmins();

