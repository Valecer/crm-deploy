/**
 * Fix Master Status Script
 * Promotes admin1, admin2, and master1 to master accounts
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'database.sqlite');

async function fixMasterStatus() {
  let db;
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    
    await db.exec('PRAGMA foreign_keys = ON');

    // Fix admin1
    console.log('Checking current admin1 status...');
    const admin1 = await db.get('SELECT id, login, is_master FROM administrators WHERE login = ?', ['admin1']);
    if (admin1) {
      if (admin1.is_master === 1) {
        console.log('✅ admin1 is already a master account');
      } else {
        await db.run('UPDATE administrators SET is_master = 1 WHERE login = ?', ['admin1']);
        console.log('✅ admin1 promoted to master account');
      }
    }

    // Fix admin2
    console.log('Checking current admin2 status...');
    const admin2 = await db.get('SELECT id, login, is_master FROM administrators WHERE login = ?', ['admin2']);
    if (admin2) {
      if (admin2.is_master === 1) {
        console.log('✅ admin2 is already a master account');
      } else {
        await db.run('UPDATE administrators SET is_master = 1 WHERE login = ?', ['admin2']);
        console.log('✅ admin2 promoted to master account');
      }
    }

    // Fix master1
    console.log('Checking current master1 status...');
    const master1 = await db.get('SELECT id, login, is_master FROM administrators WHERE login = ?', ['master1']);
    if (master1) {
      if (master1.is_master === 1) {
        console.log('✅ master1 is already a master account');
      } else {
        await db.run('UPDATE administrators SET is_master = 1 WHERE login = ?', ['master1']);
        console.log('✅ master1 promoted to master account');
      }
    } else {
      console.log('⚠ master1 account not found');
    }
    
    // Check all admins
    console.log('\nCurrent admin status:');
    const admins = await db.all(`
      SELECT id, login, is_master 
      FROM administrators
      WHERE login IN ('admin1', 'admin2', 'master1')
      ORDER BY login
    `);
    
    admins.forEach(admin => {
      console.log(`  ${admin.login}: ID=${admin.id}, Master=${admin.is_master === 1 ? 'YES' : 'NO'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

fixMasterStatus();

