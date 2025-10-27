// Setup script for Parking Marketplace database
// Mastercard DeFi Hackathon - Institutional Parking Asset Tokenization

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Get database connection
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL in .env file');
  }

  if (!password) {
    throw new Error('Missing SUPABASE_DB_PASSWORD or DATABASE_URL in .env file');
  }

  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  return `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
};

async function setupDatabase() {
  console.log('🚀 Starting Parking Marketplace Database Setup...\n');

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Read SQL file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const sqlPath = join(__dirname, '../../database/parking_marketplace.sql');

    console.log('📄 Reading SQL file:', sqlPath);
    const sql = readFileSync(sqlPath, 'utf8');

    // Execute SQL
    console.log('⚙️  Executing SQL setup...');
    await pool.query(sql);
    console.log('✅ Database tables created successfully\n');

    // Verify tables
    console.log('🔍 Verifying created tables...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'parking_%'
      ORDER BY table_name;
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log('  ✓', row.table_name);
    });

    // Check views
    const viewsResult = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE '%parking%'
      ORDER BY table_name;
    `);

    console.log('\n📊 Created views:');
    viewsResult.rows.forEach(row => {
      console.log('  ✓', row.table_name);
    });

    // Check functions
    const functionsResult = await pool.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%parking%'
      OR routine_name LIKE '%operator%'
      ORDER BY routine_name;
    `);

    console.log('\n📊 Created functions:');
    functionsResult.rows.forEach(row => {
      console.log('  ✓', row.routine_name);
    });

    console.log('\n✨ Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Start backend server: cd backend && npm start');
    console.log('  2. Start frontend: cd frontend && npm run dev');
    console.log('  3. Login and go to Institutional Operator Dashboard');
    console.log('  4. Test tokenizing a parking asset');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  - Check your DATABASE_URL or SUPABASE_DB_PASSWORD in .env');
    console.error('  - Verify your Supabase database is not paused');
    console.error('  - Ensure postgres user has CREATE TABLE permissions');
    console.error('\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();
