import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from '../database/sqlite.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import ticketRoutes from './routes/tickets.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admins.js';
import notificationRoutes from './routes/notifications.js';
import contactRoutes from './routes/contact.js';
import recoveryRoutes from './routes/recovery.js';
import configRoutes from './routes/config.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;
const DB_PATH = process.env.DB_PATH || join(__dirname, '..', '..', 'database.sqlite');

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Server Support CRM API' });
});

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/auth/recovery', recoveryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/config', configRoutes);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase(DB_PATH);
    console.log('Database initialized');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`\nTo fix this, you can:`);
        console.error(`1. Run: backend\\kill-port.bat (to kill the process on this port)`);
        console.error(`2. Or find and kill the process manually using:`);
        console.error(`   netstat -ano | findstr :${PORT}`);
        console.error(`   taskkill /F /PID <process_id>`);
        console.error(`3. Or change the PORT in your .env file\n`);
      } else {
        console.error('Failed to start server:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  // Shutting down gracefully
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // Shutting down gracefully
  process.exit(0);
});

startServer();

