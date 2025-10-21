import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rauhggtfprbbnrbfdpqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdWhnZ3RmcHJiYm5yYmZkcHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDgyMDksImV4cCI6MjA3NjU4NDIwOX0.o7AM8E3HVNklgqt0BKbEuxlQ0T8QP_Ky9vW0tm1zfWw'
);

async function seedDatabase() {
  try {
    console.log('🌱 Rozpoczynam seedowanie bazy...');

    // Dodaj przykładowych użytkowników
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        { email: 'driver@test.com', full_name: 'Jan Kowalski', role: 'driver' },
        { email: 'owner@test.com', full_name: 'Anna Nowak', role: 'owner' },
        { email: 'inspector@test.com', full_name: 'Piotr Wiśniewski', role: 'inspector' }
      ])
      .select();

    if (usersError) {
      console.log('⚠️  Użytkownicy już istnieją lub błąd:', usersError.message);
    } else {
      console.log('✅ Dodano użytkowników:', users.length);
    }

    // Sprawdź czy parkingi już istnieją
    const { data: existingLots } = await supabase
      .from('parking_lots')
      .select('id')
      .limit(1);

    if (existingLots && existingLots.length > 0) {
      console.log('✅ Parkingi już istnieją w bazie!');
      return;
    }

    // Dodaj parkingi
    const { data: lots, error: lotsError } = await supabase
      .from('parking_lots')
      .insert([
        {
          name: 'Parking Centrum Warszawa',
          address: 'ul. Marszałkowska 1',
          city: 'Warszawa',
          latitude: 52.2297,
          longitude: 19.1451,
          capacity: 10,
          current_occupancy: 5,
          hourly_rate: 15.00,
          description: 'Parking w centrum miasta',
          status: 'active'
        },
        {
          name: 'Parking Dworcowy',
          address: 'ul. Dworcowa 5',
          city: 'Warszawa',
          latitude: 52.2330,
          longitude: 19.1520,
          capacity: 8,
          current_occupancy: 3,
          hourly_rate: 12.00,
          description: 'Blisko dworca PKP',
          status: 'active'
        },
        {
          name: 'Parking Galeria',
          address: 'ul. Handlowa 10',
          city: 'Warszawa',
          latitude: 52.2250,
          longitude: 19.1380,
          capacity: 15,
          current_occupancy: 0,
          hourly_rate: 20.00,
          description: 'Przy centrum handlowym',
          status: 'active'
        },
        {
          name: 'Parking Stary Rynek',
          address: 'Rynek Starego Miasta 3',
          city: 'Warszawa',
          latitude: 52.2280,
          longitude: 19.1500,
          capacity: 12,
          current_occupancy: 4,
          hourly_rate: 18.00,
          description: 'Parking przy starówce',
          status: 'active'
        },
        {
          name: 'Parking Osiedle Ursynów',
          address: 'ul. Mieszkalna 20',
          city: 'Warszawa',
          latitude: 52.2350,
          longitude: 19.1420,
          capacity: 20,
          current_occupancy: 8,
          hourly_rate: 10.00,
          description: 'Parking osiedlowy',
          status: 'active'
        }
      ])
      .select();

    if (lotsError) {
      console.error('❌ Błąd przy dodawaniu parkingów:', lotsError);
    } else {
      console.log('✅ Dodano parkingi:', lots.length);
    }

    console.log('🎉 Seedowanie zakończone!');
  } catch (error) {
    console.error('❌ Błąd podczas seedowania:', error);
    process.exit(1);
  }
}

seedDatabase();