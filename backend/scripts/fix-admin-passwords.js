/**
 * Password Fix Utility Script
 * 
 * Fixes password hashes for administrator accounts that have missing or incorrect passwords.
 * 
 * Usage:
 *   node backend/scripts/fix-admin-passwords.js <login> <password>
 * 
 * Examples:
 *   node backend/scripts/fix-admin-passwords.js admin2 admin123
 *   node backend/scripts/fix-admin-passwords.js master1 "master 123"
 * 
 * This script:
 * 1. Validates that login and password arguments are provided
 * 2. Finds the administrator account by login
 * 3. Generates a new bcrypt password hash
 * 4. Updates the password_hash in the database
 * 5. Verifies the update was successful
 */

import { hashPassword } from '../src/services/auth.js';
import { getAdministratorByLogin } from '../src/models/Administrator.js';
import { getDatabase } from '../src/database/sqlite.js';

async function fixAdminPassword(login, password) {
  try {
    // Validate arguments
    if (!login || !password) {
      console.error('Error: Login and password are required');
      console.error('Usage: node fix-admin-passwords.js <login> <password>');
      console.error('Example: node fix-admin-passwords.js admin2 admin123');
      process.exit(1);
    }

    // Trim login for consistency
    const trimmedLogin = login.trim();
    
    if (!trimmedLogin) {
      console.error('Error: Login cannot be empty');
      process.exit(1);
    }

    // Get database connection
    const db = getDatabase();

    // Check if administrator exists
    const admin = await getAdministratorByLogin(trimmedLogin);
    
    if (!admin) {
      console.error(`Error: Administrator with login "${trimmedLogin}" not found`);
      process.exit(1);
    }

    console.log(`Found administrator: ${admin.id} (${admin.login})`);

    // Generate password hash
    console.log('Generating password hash...');
    const passwordHash = await hashPassword(password);

    // Update password hash in database
    console.log('Updating password hash in database...');
    const result = await db.run(
      'UPDATE administrators SET password_hash = ? WHERE id = ?',
      [passwordHash, admin.id]
    );

    if (result.changes === 0) {
      console.error('Error: Failed to update password hash');
      process.exit(1);
    }

    // Verify update
    const updatedAdmin = await db.get(
      'SELECT id, login, password_hash FROM administrators WHERE id = ?',
      [admin.id]
    );

    if (!updatedAdmin || !updatedAdmin.password_hash) {
      console.error('Error: Password hash was not updated correctly');
      process.exit(1);
    }

    console.log('✓ Password hash updated successfully');
    console.log(`✓ Administrator ${trimmedLogin} can now log in with the provided password`);

  } catch (error) {
    console.error('Error fixing password:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Error: Login and password are required');
  console.error('Usage: node fix-admin-passwords.js <login> <password>');
  console.error('Example: node fix-admin-passwords.js admin2 admin123');
  console.error('Example: node fix-admin-passwords.js master1 "master 123"');
  process.exit(1);
}

const [login, password] = args;

// Run the fix
fixAdminPassword(login, password).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

