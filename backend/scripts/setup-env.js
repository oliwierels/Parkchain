// Interactive .env setup helper
// Helps you configure your Supabase connection

import readline from 'readline';
import { writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateJwtSecret() {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
console.log('\n🚀 Parkchain Backend Environment Setup\n');
console.log('This wizard will help you create your .env file for Supabase connection.\n');

// Check if .env already exists
if (existsSync(envPath)) {
  console.log('⚠️  Warning: .env file already exists!');
  const overwrite = await question('Do you want to overwrite it? (yes/no): ');
  if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
    console.log('Aborting. Your existing .env file was not changed.');
    rl.close();
    process.exit(0);
  }
  console.log('');
}

console.log('📝 Please provide your Supabase credentials:\n');
console.log('How to find them:');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Follow the instructions below\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Ask for configuration method
console.log('Choose configuration method:');
console.log('1. Direct Database URL (recommended - easiest)');
console.log('2. Individual fields (SUPABASE_URL, password, etc.)\n');

const method = await question('Enter 1 or 2: ');
console.log('');

let envContent = `# Parkchain Backend Environment Variables
# Generated on ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO GIT!

NODE_ENV=development
PORT=3000

`;

if (method === '1') {
  // Method 1: Direct database URL
  console.log('🔗 Direct Database URL Method\n');
  console.log('Go to Supabase Dashboard → Settings → Database → Connection string');
  console.log('Select the "URI" tab\n');
  console.log('The connection string looks like:');
  console.log('postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres\n');
  console.log('⚠️  IMPORTANT: Replace [YOUR-PASSWORD] with your actual database password!\n');

  const databaseUrl = await question('Paste your DATABASE_URL here: ');

  if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
    console.log('\n❌ Invalid database URL. It should start with postgresql://');
    rl.close();
    process.exit(1);
  }

  envContent += `# Supabase Database Connection
DATABASE_URL=${databaseUrl}

`;

  // Extract project info for additional fields
  try {
    const match = databaseUrl.match(/db\.([^.]+)\.supabase\.co/);
    if (match) {
      const projectRef = match[1];
      envContent += `# Supabase Additional Info (optional)
SUPABASE_URL=https://${projectRef}.supabase.co
`;
    }
  } catch (e) {
    // Skip if can't extract
  }

} else {
  // Method 2: Individual fields
  console.log('📋 Individual Fields Method\n');

  console.log('Step 1: SUPABASE_URL');
  console.log('Go to: Settings → API → Project URL');
  console.log('Format: https://abcdefghijk.supabase.co\n');
  const supabaseUrl = await question('SUPABASE_URL: ');

  console.log('\nStep 2: Database Password');
  console.log('Go to: Settings → Database');
  console.log('If you forgot it, click "Reset database password"\n');
  const dbPassword = await question('Database Password: ');

  console.log('\nStep 3 (Optional): SUPABASE_ANON_KEY');
  console.log('Go to: Settings → API → Project API keys');
  console.log('Copy the "anon public" key (starts with eyJ...)\n');
  const anonKey = await question('SUPABASE_ANON_KEY (press Enter to skip): ');

  if (!supabaseUrl || !dbPassword) {
    console.log('\n❌ SUPABASE_URL and Database Password are required!');
    rl.close();
    process.exit(1);
  }

  // Extract project ref
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    console.log('\n❌ Invalid SUPABASE_URL format. Should be: https://PROJECT.supabase.co');
    rl.close();
    process.exit(1);
  }

  const projectRef = match[1];
  const databaseUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

  envContent += `# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_DB_PASSWORD=${dbPassword}
DATABASE_URL=${databaseUrl}
`;

  if (anonKey) {
    envContent += `SUPABASE_ANON_KEY=${anonKey}
`;
  }

  envContent += '\n';
}

// JWT Secret
console.log('\n🔐 JWT Secret');
console.log('Generating a secure random JWT secret...');
const jwtSecret = generateJwtSecret();
envContent += `# JWT Authentication
JWT_SECRET=${jwtSecret}
`;

// Write .env file
console.log('\n💾 Saving .env file...');
try {
  writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!\n');
  console.log('File location: ' + envPath);
  console.log('\n📝 Next steps:');
  console.log('1. Run: npm run setup:marketplace');
  console.log('2. Then: npm start\n');
} catch (error) {
  console.log('❌ Error writing .env file:', error.message);
  process.exit(1);
}

rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
