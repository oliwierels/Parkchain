// Script to apply parking type migration
// Run with: node scripts/apply-parking-type-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Błąd: Brak SUPABASE_URL lub SUPABASE_ANON_KEY w pliku .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Rozpoczynam migrację: dodawanie kolumny type do parking_lots...\n');

  try {
    // Check if column already exists
    console.log('1️⃣ Sprawdzam czy kolumna type już istnieje...');
    const { data: columns, error: checkError } = await supabase
      .from('parking_lots')
      .select('type')
      .limit(1);

    if (!checkError) {
      console.log('✅ Kolumna type już istnieje w tabeli parking_lots!');
      console.log('ℹ️  Migracja prawdopodobnie była już wykonana.');

      // Show current type distribution
      const { data: types } = await supabase
        .from('parking_lots')
        .select('type, id');

      if (types) {
        const distribution = types.reduce((acc, row) => {
          acc[row.type || 'null'] = (acc[row.type || 'null'] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📊 Obecny rozkład typów parkingów:');
        Object.entries(distribution).forEach(([type, count]) => {
          const icon = type === 'covered' ? '☂️' : type === 'ev_charging' ? '⚡' : type === 'outdoor' ? '☀️' : '❓';
          console.log(`   ${icon} ${type}: ${count}`);
        });
      }

      return;
    }

    console.log('⚠️  Kolumna type nie istnieje. Musisz dodać ją przez Supabase Dashboard.');
    console.log('\n📝 Instrukcje:');
    console.log('1. Otwórz https://supabase.com/dashboard');
    console.log('2. Wybierz projekt Parkchain');
    console.log('3. Przejdź do SQL Editor');
    console.log('4. Skopiuj i uruchom zawartość pliku: database/add_parking_type.sql');
    console.log('\n💡 Supabase JS Client nie może modyfikować schemy bazy danych.');
    console.log('   Użyj SQL Editor w dashboardzie Supabase.');

  } catch (error) {
    console.error('❌ Błąd podczas migracji:', error.message);
    process.exit(1);
  }
}

// Read and display the migration SQL
const migrationPath = path.join(__dirname, '../database/add_parking_type.sql');
if (fs.existsSync(migrationPath)) {
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  console.log('\n📄 Zawartość migracji:\n');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60));
  console.log('\n');
}

applyMigration();
