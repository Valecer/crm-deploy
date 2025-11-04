import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

/**
 * Initialize SQLite database connection
 * @param {string} dbPath - Path to SQLite database file
 * @returns {Promise<import('sqlite').Database>} Database instance
 */
export async function initDatabase(dbPath) {
  if (db) {
    return db;
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Run migrations
  await runMigrations();

  // Seed initial data
  await seedDatabase();

  return db;
}

/**
 * Get database instance (must be initialized first)
 * @returns {import('sqlite').Database}
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Check if a column exists in a table
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column
 * @returns {Promise<boolean>} True if column exists
 */
async function columnExists(tableName, columnName) {
  const tableInfo = await db.all(`PRAGMA table_info(${tableName})`);
  return tableInfo.some(col => col.name === columnName);
}

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    const migrationsDir = join(__dirname, 'migrations');
    const files = await readdir(migrationsDir);
    
    // Filter and sort migration files (e.g., 001_*.sql, 002_*.sql)
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically, which will work for numbered migrations
    
    // Execute each migration in order
    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      let migrationSQL = await readFile(migrationPath, 'utf-8');
      
      console.log(`Applying migration: ${file}`);
      
      // For migration 003, check if columns exist before adding them
      if (file === '003_real_time_master_accounts.sql') {
        // Check and conditionally add display_name
        if (!(await columnExists('administrators', 'display_name'))) {
          await db.exec('ALTER TABLE administrators ADD COLUMN display_name TEXT');
        } else {
          console.log('  Column display_name already exists, skipping');
        }
        
        // Check and conditionally add is_master
        if (!(await columnExists('administrators', 'is_master'))) {
          await db.exec('ALTER TABLE administrators ADD COLUMN is_master INTEGER');
        } else {
          console.log('  Column is_master already exists, skipping');
        }
        
        // Check and conditionally add last_assigned_at
        if (!(await columnExists('administrators', 'last_assigned_at'))) {
          await db.exec('ALTER TABLE administrators ADD COLUMN last_assigned_at INTEGER');
        } else {
          console.log('  Column last_assigned_at already exists, skipping');
        }
        
        // Run the UPDATE and CREATE INDEX statements (these are safe to run multiple times)
        const updateAndIndexSQL = migrationSQL
          .split('\n')
          .filter(line => 
            line.trim().startsWith('UPDATE') || 
            line.trim().startsWith('CREATE INDEX') ||
            line.trim().startsWith('--')
          )
          .join('\n');
        
        // Execute UPDATE statements
        if (migrationSQL.includes('UPDATE administrators SET display_name')) {
          await db.exec('UPDATE administrators SET display_name = login WHERE display_name IS NULL');
        }
        if (migrationSQL.includes('UPDATE administrators SET is_master')) {
          await db.exec('UPDATE administrators SET is_master = 0 WHERE is_master IS NULL');
        }
        
        // Execute CREATE INDEX statements (IF NOT EXISTS will handle duplicates)
        if (migrationSQL.includes('CREATE INDEX')) {
          await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_administrators_is_master ON administrators(is_master);
            CREATE INDEX IF NOT EXISTS idx_administrators_display_name ON administrators(display_name);
          `);
        }
      } else if (file === '004_password_recovery.sql') {
        // Check and conditionally add codephrase column
        if (!(await columnExists('clients', 'codephrase'))) {
          // SQLite doesn't support adding UNIQUE column directly, so add without constraint first
          await db.exec('ALTER TABLE clients ADD COLUMN codephrase TEXT');
          // Then create unique index (which enforces uniqueness)
          await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_codephrase_unique ON clients(codephrase) WHERE codephrase IS NOT NULL');
          console.log('  Added codephrase column with unique index');
        } else {
          console.log('  Column codephrase already exists, skipping');
        }
        
        // Check and conditionally add recovery_pending column
        if (!(await columnExists('clients', 'recovery_pending'))) {
          await db.exec('ALTER TABLE clients ADD COLUMN recovery_pending INTEGER NOT NULL DEFAULT 0 CHECK(recovery_pending IN (0, 1))');
          console.log('  Added recovery_pending column');
        } else {
          console.log('  Column recovery_pending already exists, skipping');
        }
        
        // Execute CREATE INDEX statements (IF NOT EXISTS will handle duplicates)
        await db.exec(`
          CREATE INDEX IF NOT EXISTS idx_clients_codephrase ON clients(codephrase);
          CREATE INDEX IF NOT EXISTS idx_clients_recovery_pending ON clients(recovery_pending);
        `);
      } else {
        // For other migrations, run as-is
        await db.exec(migrationSQL);
      }
    }
    
    console.log(`Database migrations applied successfully (${migrationFiles.length} migration(s))`);
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

/**
 * Seed database with initial administrator accounts
 */
async function seedDatabase() {
  try {
    // Check if administrators already exist
    const existingAdmins = await db.all('SELECT COUNT(*) as count FROM administrators');
    if (existingAdmins[0].count > 0) {
      console.log('Database already seeded, skipping seed');
      return;
    }

    // Generate 5 administrator accounts
    const now = Math.floor(Date.now() / 1000);
    const defaultPassword = 'admin123'; // Default password for all initial admins
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const seedAdmins = [
      { id: 'admin-001', login: 'admin1' },
      { id: 'admin-002', login: 'admin2' },
      { id: 'admin-003', login: 'admin3' },
      { id: 'admin-004', login: 'admin4' },
      { id: 'admin-005', login: 'admin5' },
    ];

    // Check if display_name column exists
    const tableInfo = await db.all("PRAGMA table_info(administrators)");
    const hasDisplayName = tableInfo.some(col => col.name === 'display_name');
    const hasIsMaster = tableInfo.some(col => col.name === 'is_master');

    for (const admin of seedAdmins) {
      if (hasDisplayName && hasIsMaster) {
        // New schema with display_name and is_master columns
        await db.run(
          'INSERT INTO administrators (id, login, password_hash, display_name, is_master, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [admin.id, admin.login, passwordHash, admin.login, 0, now]
        );
      } else {
        // Old schema without these columns
        await db.run(
          'INSERT INTO administrators (id, login, password_hash, created_at) VALUES (?, ?, ?, ?)',
          [admin.id, admin.login, passwordHash, now]
        );
      }
    }

    // After seeding, ensure at least 2 master accounts exist
    if (hasIsMaster) {
      // Promote first 2 admins to master accounts
      await db.run(
        'UPDATE administrators SET is_master = 1 WHERE id IN (?, ?)',
        ['admin-001', 'admin-002']
      );
      console.log('Promoted admin1 and admin2 to master accounts');
    }

    console.log('Database seeded with 5 administrator accounts');
    console.log('Default credentials: admin1-5 / admin123');
    console.log('Master accounts: admin1, admin2 (can manage other admins and assign tickets)');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}

