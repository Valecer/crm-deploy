-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Client Accounts
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_login ON clients(login);

-- Administrator Accounts
CREATE TABLE IF NOT EXISTS administrators (
  id TEXT PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_administrators_login ON administrators(login);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  job_title TEXT NOT NULL,
  client_full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('new', 'in_progress', 'waiting_for_client', 'resolved', 'closed')),
  assigned_engineer_id TEXT,
  submitted_at INTEGER NOT NULL,
  estimated_completion_at INTEGER,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY(assigned_engineer_id) REFERENCES administrators(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_engineer_id ON tickets(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_submitted_at ON tickets(submitted_at);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('client', 'administrator')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

