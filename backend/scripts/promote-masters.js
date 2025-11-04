import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'database.sqlite');

async function promoteMasters() {
  let db;
  try {
    db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await db.exec('PRAGMA foreign_keys = ON');

    // Check if migration columns exist
    const tableInfo = await db.all("PRAGMA table_info(administrators)");
    const hasIsMaster = tableInfo.some(col => col.name === 'is_master');
    
    if (!hasIsMaster) {
      console.log('Migration not yet applied. Please start the backend server first to run migrations.');
      return;
    }

    // Get current master count
    const masters = await db.all('SELECT COUNT(*) as count FROM administrators WHERE is_master = 1');
    const masterCount = masters[0].count;

    if (masterCount >= 2) {
      console.log(`✓ Already have ${masterCount} master account(s). No changes needed.`);
      const allMasters = await db.all('SELECT id, login, display_name FROM administrators WHERE is_master = 1 ORDER BY id');
      allMasters.forEach(m => {
        console.log(`  - ${m.login} (${m.id})`);
      });
      return;
    }

    // Promote first 2 admins (or however many needed)
    const needed = 2 - masterCount;
    const adminsToPromote = await db.all(
      'SELECT id, login FROM administrators WHERE is_master = 0 OR is_master IS NULL ORDER BY id LIMIT ?',
      [needed]
    );

    if (adminsToPromote.length === 0) {
      console.log('No administrators available to promote.');
      return;
    }

    for (const admin of adminsToPromote) {
      await db.run('UPDATE administrators SET is_master = 1 WHERE id = ?', [admin.id]);
      console.log(`✓ Promoted ${admin.login} (${admin.id}) to master account`);
    }

    // Show credentials
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('         MASTER ACCOUNT CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const allMasters = await db.all(
      'SELECT id, login, display_name FROM administrators WHERE is_master = 1 ORDER BY id'
    );
    
    allMasters.forEach((admin, i) => {
      const displayName = admin.display_name || admin.login;
      console.log(`${i + 1}. Login: ${admin.login}`);
      console.log(`   Display Name: ${displayName}`);
      console.log(`   Password: admin123`);
      console.log(`   Type: MASTER ACCOUNT\n`);
    });

    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    if (error.code === 'SQLITE_CANTOPEN') {
      console.error('Database not found. Please start the backend server first.');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  } finally {
    if (db) await db.close();
  }
}

promoteMasters();

