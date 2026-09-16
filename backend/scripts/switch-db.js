const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'sqlite';
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(schemaPath)) {
  console.error('schema.prisma not found at ' + schemaPath);
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

if (target === 'sqlite') {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema);
  if (!process.env.DATABASE_URL) {
    fs.writeFileSync(envPath, 'PORT=5000\nJWT_SECRET=vegas_cafe_jwt_secret_key_super_secure_2026\nDATABASE_URL="file:./dev.db"\n');
  }
  console.log('Successfully configured Prisma for SQLite!');
} else if (target === 'postgres') {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
  if (!process.env.DATABASE_URL && !fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, 'PORT=5000\nJWT_SECRET=vegas_cafe_jwt_secret_key_super_secure_2026\nDATABASE_URL="postgresql://postgres:postgres@localhost:5432/vegas_cafe?schema=public"\n');
  }
  console.log('Successfully configured Prisma for PostgreSQL!');
} else {
  console.error('Unknown target. Use "sqlite" or "postgres"');
}
