// backend/server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { geocodeAddress } from './services/geocodingService.js';
import { authenticateToken } from './middleware/auth.js';

// Załaduj zmienne środowiskowe
dotenv.config();

// Sprawdź konfigurację Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
}

// Inicjalizacja klienta Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());

// ========== AUTENTYKACJA ==========

// POST /api/auth/register - rejestracja
app.post('/api/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, full_name } = req.body;

    // Sprawdź czy użytkownik już istnieje
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hashuj hasło
    const password_hash = await bcrypt.hash(password, 10);

    // Stwórz użytkownika
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash,
        full_name,
        role: 'user'
      }])
      .select()
      .single();

    if (error) throw error;

    // Stwórz JWT token
    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - logowanie
app.post('/api/auth/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Znajdź użytkownika
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sprawdź hasło
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Stwórz JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - pobierz dane zalogowanego użytkownika
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Fetching user, req.user:', req.user); // DODAJ TO
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('id', req.user.id)
      .single();

    console.log('📍 Supabase response:', { data, error }); // DODAJ TO

    if (error) {
      console.error('❌ Supabase error:', error); // DODAJ TO
      throw error;
    }

    console.log('✅ Returning user:', data); // DODAJ TO
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching user:', error); // DODAJ TO
    res.status(500).json({ error: error.message });
  }
});
// ========== PARKINGI ==========

// GET /api/lots - pobierz wszystkie parkingi
app.get('/api/lots', async (req, res) => {
  try {
    console.log('🔍 Fetching parking lots from Supabase...');

    // Zwiększ limit dla dużej liczby parkingów (domyślnie Supabase ma limit 1000)
    const { data, error, count } = await supabase
      .from('parking_lots')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Found parking lots:', data?.length);
    console.log('📊 Total count in database:', count);

    if (data && data.length > 0) {
      console.log('📍 First parking:', data[0]);
      const withCoords = data.filter(p => p.latitude && p.longitude).length;
      console.log(`📍 Parkings with coordinates: ${withCoords}/${data.length}`);
    }

    res.json({ lots: data || [] });
  } catch (error) {
    console.error('❌ Error fetching parking lots:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lots - dodaj parking (BACKWARD COMPATIBILITY)
app.post('/api/lots', authenticateToken, async (req, res) => {
  try {
    const { name, address, price_per_hour, total_spots, latitude, longitude, available_spots } = req.body;
    const owner_id = req.user.id;
    
    const { data, error } = await supabase
      .from('parking_lots')
      .insert([{
        name,
        address,
        price_per_hour: price_per_hour || 0,
        total_spots: total_spots || 10,
        available_spots: available_spots !== undefined ? available_spots : total_spots || 10,
        latitude: latitude || null,
        longitude: longitude || null,
        owner_id
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating parking lot:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/parking-lots - dodaj parking (tylko dla zalogowanych)
app.post('/api/parking-lots', authenticateToken, [
  body('name').notEmpty(),
  body('address').notEmpty(),
  body('price_per_hour').isNumeric(),
  body('total_spots').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, address, price_per_hour, total_spots, latitude, longitude } = req.body;
    const owner_id = req.user.id;
    
    const { data, error } = await supabase
      .from('parking_lots')
      .insert([{
        name,
        address,
        price_per_hour,
        total_spots,
        available_spots: total_spots,
        latitude: latitude || null,
        longitude: longitude || null,
        owner_id
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating parking lot:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/parking-lots/my - pobierz parkingi zalogowanego właściciela
app.get('/api/parking-lots/my', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('parking_lots')
      .select('*')
      .eq('owner_id', req.user.id);
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching my parking lots:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/parking-lots/:id - edytuj parking (tylko właściciel)
app.put('/api/parking-lots/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, price_per_hour, total_spots, latitude, longitude } = req.body;
    
    // Sprawdź czy parking należy do użytkownika
    const { data: parking, error: fetchError } = await supabase
      .from('parking_lots')
      .select('owner_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !parking) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }
    
    if (parking.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Aktualizuj
    const { data, error } = await supabase
      .from('parking_lots')
      .update({
        name,
        address,
        price_per_hour,
        total_spots,
        latitude: latitude || null,
        longitude: longitude || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error updating parking lot:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/parking-lots/:id - usuń parking (tylko właściciel)
app.delete('/api/parking-lots/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy parking należy do użytkownika
    const { data: parking, error: fetchError } = await supabase
      .from('parking_lots')
      .select('owner_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !parking) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }
    
    if (parking.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Usuń
    const { error } = await supabase
      .from('parking_lots')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ message: 'Parking lot deleted successfully' });
  } catch (error) {
    console.error('Error deleting parking lot:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== REZERWACJE ==========

// GET /api/reservations - pobierz wszystkie rezerwacje (admin)
app.get('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        parking_lots (
          name,
          address
        ),
        users (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reservations - stwórz rezerwację
app.post('/api/reservations', authenticateToken, [
  body('lot_id').isInt(),
  body('start_time').notEmpty(),
  body('end_time').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { lot_id, start_time, end_time, license_plate } = req.body;
    const user_id = req.user.id;
    
    // Sprawdź dostępność i pobierz cenę
    const { data: parking, error: parkingError } = await supabase
      .from('parking_lots')
      .select('available_spots, price_per_hour')
      .eq('id', lot_id)
      .single();
    
    if (parkingError || !parking) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }
    
    if (parking.available_spots <= 0) {
      return res.status(400).json({ error: 'No available spots' });
    }
    
    // WAŻNE: Oblicz cenę
    const hours = (new Date(end_time) - new Date(start_time)) / (1000 * 60 * 60);
    const price = hours * parking.price_per_hour;
    
    console.log('💰 Obliczona cena:', price, 'zł za', hours, 'godzin');
    
    // Stwórz rezerwację z ceną
    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        user_id,
        lot_id,
        start_time,
        end_time,
        license_plate: license_plate || null,
        price: price, // DODAJ TO
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Błąd tworzenia rezerwacji:', error);
      throw error;
    }
    
    // Zmniejsz dostępne miejsca
    await supabase
      .from('parking_lots')
      .update({ available_spots: parking.available_spots - 1 })
      .eq('id', lot_id);
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reservations/my - pobierz rezerwacje użytkownika
app.get('/api/reservations/my', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        parking_lots (
          name,
          address,
          city
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ reservations: data || [] }); // WAŻNE: zwraca { reservations: [...] }
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: error.message });
  }
});
// PUT /api/reservations/:id - aktualizuj rezerwację
app.put('/api/reservations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Sprawdź czy rezerwacja należy do użytkownika
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    if (reservation.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Aktualizuj
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reservations/:id/cancel - anuluj rezerwację
app.put('/api/reservations/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy rezerwacja należy do użytkownika
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('user_id, lot_id, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    if (reservation.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reservation already cancelled' });
    }
    
    // Anuluj rezerwację
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Zwiększ dostępne miejsca
    const { data: parking } = await supabase
      .from('parking_lots')
      .select('available_spots')
      .eq('id', reservation.lot_id)
      .single();
    
    if (parking) {
      await supabase
        .from('parking_lots')
        .update({ available_spots: parking.available_spots + 1 })
        .eq('id', reservation.lot_id);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reservations/:id - usuń rezerwację
app.delete('/api/reservations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy rezerwacja należy do użytkownika
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('user_id, lot_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    if (reservation.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Usuń
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Zwiększ dostępne miejsca
    const { data: parking } = await supabase
      .from('parking_lots')
      .select('available_spots')
      .eq('id', reservation.lot_id)
      .single();
    
    if (parking) {
      await supabase
        .from('parking_lots')
        .update({ available_spots: parking.available_spots + 1 })
        .eq('id', reservation.lot_id);
    }
    
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GEOCODING ==========

// POST /api/geocode - geocode adresu
app.post('/api/geocode', [
  body('address').notEmpty().withMessage('Address is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { address } = req.body;
    const coordinates = await geocodeAddress(address);

    if (!coordinates) {
      return res.status(404).json({
        error: 'Address not found',
        message: 'Could not geocode the provided address'
      });
    }

    res.json(coordinates);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      error: 'Geocoding failed',
      message: error.message
    });
  }
});

// ========== BLOCKCHAIN ==========

// GET /api/blockchain/parking/:id - pobierz dane parkingu z blockchain
app.get('/api/blockchain/parking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      message: 'Blockchain integration coming soon',
      parking_id: id
    });
  } catch (error) {
    console.error('Blockchain error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/blockchain/verify - weryfikuj transakcję
app.post('/api/blockchain/verify', authenticateToken, async (req, res) => {
  try {
    const { transaction_hash } = req.body;
    
    res.json({
      message: 'Blockchain verification coming soon',
      transaction_hash
    });
  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== HEALTH CHECK ==========

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'ParkChain API',
    version: '1.0.0',
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/me'],
      lots: ['/api/lots', '/api/parking-lots', '/api/parking-lots/my'],
      reservations: ['/api/reservations', '/api/reservations/my'],
      geocode: ['/api/geocode'],
      blockchain: ['/api/blockchain/parking/:id', '/api/blockchain/verify']
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
// GET /api/users/stats - statystyki użytkownika
app.get('/api/users/stats', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Pobierz wszystkie rezerwacje użytkownika
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user_id);
    
    if (error) throw error;
    
    const totalReservations = reservations.length;
    const activeReservations = reservations.filter(r => 
      ['pending', 'active'].includes(r.status)
    ).length;
    const totalSpent = reservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
    
    res.json({
      stats: {
        totalReservations,
        activeReservations,
        totalSpent: totalSpent.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});
// GET /api/users/stats - statystyki użytkownika
app.get('/api/users/stats', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    console.log('📊 Pobieranie statystyk dla user_id:', user_id);
    
    // Pobierz wszystkie rezerwacje użytkownika
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user_id);
    
    if (error) {
      console.error('❌ Błąd pobierania rezerwacji:', error);
      throw error;
    }
    
    console.log('✅ Znaleziono rezerwacji:', reservations?.length);
    
    const totalReservations = reservations?.length || 0;
    const activeReservations = reservations?.filter(r => 
      ['pending', 'active'].includes(r.status)
    ).length || 0;
    const totalSpent = reservations
      ?.filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0) || 0;
    
    res.json({
      stats: {
        totalReservations,
        activeReservations,
        totalSpent: totalSpent.toFixed(2)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});
// Start serwera
app.listen(port, () => {
  console.log(`🚀 Parkchain API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { supabase };