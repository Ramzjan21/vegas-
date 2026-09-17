import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import apiRoutes from './routes';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import prisma from './config/db';
import { seedInitialData } from './utils/seedData';

dotenv.config();

const execAsync = util.promisify(exec);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check / Root (responds immediately without DB requirement)
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Vegas Cafe Management System API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Background Database Initialization (Non-blocking so port binds instantly)
async function initializeDatabase() {
  console.log('📡 [DB Init] Checking database connection...');
  try {
    // If in production/Render environment, make sure tables exist via prisma db push
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.log('🔄 [DB Init] Synchronizing Prisma schema with database...');
      try {
        const { stdout } = await execAsync('npx prisma db push --accept-data-loss');
        console.log('✅ [DB Init] Schema sync complete:', stdout.trim().split('\n')[0]);
      } catch (pushErr: any) {
        console.warn('⚠️ [DB Init] Schema push notice:', pushErr.message);
      }
    }

    // Check if initial seed is needed
    const userCount = await prisma.user.count();
    console.log(`📊 [DB Init] Found ${userCount} existing users in database.`);

    if (userCount === 0) {
      console.log('🌱 [DB Init] Empty database detected. Seeding initial demo data...');
      await seedInitialData();
      console.log('✅ [DB Init] Demo data seeded successfully!');
    } else {
      console.log('✨ [DB Init] Database is already populated and ready.');
    }
  } catch (err: any) {
    console.error('⚠️ [DB Init] Error during database initialization:', err.message);
  }
}

// Start Server immediately bound to 0.0.0.0 for Render / cloud container compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 VEGAS CAFE BACKEND API SERVER IS RUNNING`);
  console.log(`📡 Host: 0.0.0.0 | Port: ${PORT}`);
  console.log(`🎯 API: http://localhost:${PORT}/api`);
  console.log(`=============================================`);

  // Run initialization in background without blocking port scan
  initializeDatabase().catch((err) => {
    console.error('Fatal DB Init error:', err);
  });
});

export default app;

