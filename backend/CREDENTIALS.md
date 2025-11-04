# Administrator Credentials

## Master Accounts (Can manage admins and assign tickets)

These accounts have full administrative privileges and can:
- Create and delete other administrator accounts
- Manually assign tickets to any administrator
- Edit display names for any administrator
- View ALL tickets regardless of assignment
- See administrator management section in dashboard

**Master Account 1:**
- **Login:** `admin1`
- **Password:** `admin123`
- **Display Name:** `admin1` (can be changed after login)
- **Type:** MASTER ACCOUNT

**Master Account 2:**
- **Login:** `admin2`
- **Password:** `admin123`
- **Display Name:** `admin2` (can be changed after login)
- **Type:** MASTER ACCOUNT

**Master Account 3:**
- **Login:** `master1`
- **Password:** `master 123`
- **Display Name:** `master1` (can be changed after login)
- **Type:** MASTER ACCOUNT

## Regular Administrator Accounts

These accounts can manage tickets but cannot:
- Create or delete administrator accounts
- Manually assign tickets (tickets are auto-assigned)
- See administrator management section
- View tickets assigned to other administrators (only see their own assigned tickets)

**Regular Account 1:**
- **Login:** `admin3`
- **Password:** `admin123`
- **Display Name:** `admin3` (can be changed after login)

**Regular Account 2:**
- **Login:** `admin4`
- **Password:** `admin123`
- **Display Name:** `admin4` (can be changed after login)

**Regular Account 3:**
- **Login:** `admin5`
- **Password:** `admin123`
- **Display Name:** `admin5` (can be changed after login)

---

## Quick Start

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   The migration will run automatically on first start, and admin1/admin2 will be promoted to master accounts.

2. **If the database already exists**, run:
   ```bash
   cd backend
   npm run promote-masters
   ```
   This will ensure admin1 and admin2 are master accounts.

3. **To add a new master account**, use:
   ```bash
   cd backend
   node scripts/add-master-account.js [login] [password]
   ```
   Example:
   ```bash
   node scripts/add-master-account.js master1 "master 123"
   ```
   Or use the default (master1 / master 123):
   ```bash
   node scripts/add-master-account.js
   ```

4. **To check or create master accounts manually**, use:
   ```bash
   cd backend
   node scripts/setup-master-accounts.js
   ```
   This script will:
   - Apply the migration if needed
   - Promote at least 2 administrators to master accounts if needed
   - Display all current administrator credentials

5. **Login at:** `http://localhost:5173` (or your frontend URL)
   - Use `admin1` / `admin123`, `admin2` / `admin123`, or `master1` / `master 123` for master account access
   - Use `admin3` / `admin123` (or admin4, admin5) for regular admin access

---

## Checking Current Master Accounts

To see which accounts are currently master accounts, you can:

1. **Using the setup script:**
   ```bash
   cd backend
   node scripts/setup-master-accounts.js
   ```

2. **Using SQLite directly:**
   ```bash
   cd backend
   sqlite3 database.sqlite "SELECT id, login, display_name, is_master FROM administrators ORDER BY is_master DESC, id ASC;"
   ```

3. **Using the promote script:**
   ```bash
   cd backend
   node scripts/promote-masters.js
   ```

---

## Notes

- All passwords are set to `admin123` by default
- You can change passwords and display names after logging in
- At least 2 master accounts are required for the system to function properly
- Master accounts cannot delete themselves if they are the last master
- Regular administrators only see tickets assigned to them
- Master accounts see all tickets and have full administrative control

