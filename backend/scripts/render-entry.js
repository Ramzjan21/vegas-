const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('=====================================================');
  console.log('🚀 VEGAS CAFE: Render Production Startup Process');
  console.log('=====================================================');

  // 1. Sync Prisma schema with database
  try {
    console.log('📡 Synchronizing database schema with PostgreSQL...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Database schema in sync!');
  } catch (e) {
    console.error('⚠️ Database sync warning:', e.message);
  }

  // 2. Auto-seed if database is brand new
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 Empty database detected. Seeding initial demo data...');
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
      console.log('✅ Demo data seeded successfully!');
    } else {
      console.log(`ℹ️ Database already initialized (${userCount} users found). Skipping seed.`);
    }
  } catch (err) {
    console.error('⚠️ Seed check error:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 3. Start Express server
  console.log('🔥 Starting Vegas Cafe Web Service...');
  require('../dist/server.js');
}

main();
