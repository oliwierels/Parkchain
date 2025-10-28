// Script to apply payment columns migration
// Run with: node scripts/apply-payment-columns-migration.js

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

async function checkMigration() {
  console.log('🔄 Sprawdzam migrację: dodawanie kolumn payment_method i pricing_type...\n');

  try {
    // Check if columns already exist
    console.log('1️⃣ Sprawdzam czy kolumny już istnieją...');
    const { data: testData, error: checkError } = await supabase
      .from('reservations')
      .select('payment_method, pricing_type')
      .limit(1);

    if (!checkError) {
      console.log('✅ Kolumny payment_method i pricing_type już istnieją!');
      console.log('ℹ️  Migracja prawdopodobnie była już wykonana.');

      // Show current distribution
      const { data: reservations } = await supabase
        .from('reservations')
        .select('payment_method, pricing_type, id');

      if (reservations && reservations.length > 0) {
        const methodDist = reservations.reduce((acc, row) => {
          acc[row.payment_method || 'null'] = (acc[row.payment_method || 'null'] || 0) + 1;
          return acc;
        }, {});

        const pricingDist = reservations.reduce((acc, row) => {
          acc[row.pricing_type || 'null'] = (acc[row.pricing_type || 'null'] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📊 Rozkład metod płatności:');
        Object.entries(methodDist).forEach(([method, count]) => {
          const icon = method === 'gateway' ? '⚡' : method === 'solana' ? '◎' : method === 'card' ? '💳' : method === 'later' ? '🕐' : '❓';
          console.log(`   ${icon} ${method}: ${count}`);
        });

        console.log('\n📊 Rozkład typów cenowych:');
        Object.entries(pricingDist).forEach(([type, count]) => {
          console.log(`   • ${type}: ${count}`);
        });
      }

      return;
    }

    console.log('⚠️  Kolumny nie istnieją. Musisz dodać je przez Supabase Dashboard SQL Editor.');
    console.log('\n📝 Instrukcje:');
    console.log('1. Otwórz https://supabase.com/dashboard');
    console.log('2. Wybierz projekt Parkchain');
    console.log('3. Przejdź do SQL Editor');
    console.log('4. Skopiuj i uruchom poniższą migrację SQL');
    console.log('\n💡 Supabase JS Client nie może modyfikować schemy bazy danych.');
    console.log('   Użyj SQL Editor w dashboardzie Supabase.\n');

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania migracji:', error.message);

    console.log('\n⚠️  Najprawdopodobniej kolumny nie istnieją.');
    console.log('📝 Uruchom poniższą migrację SQL w Supabase Dashboard:\n');
  }
}

// Read and display the migration SQL
const migrationPath = path.join(__dirname, '../backend/migrations/add_payment_columns.sql');
if (fs.existsSync(migrationPath)) {
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  console.log('\n📄 Zawartość migracji:\n');
  console.log('─'.repeat(80));
  console.log(migrationSQL);
  console.log('─'.repeat(80));
  console.log('\n');
}

checkMigration();
