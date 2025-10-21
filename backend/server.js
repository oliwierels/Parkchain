// backend/server.js

import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import { geocodeAddress } from './services/geocodingService.js';

// Supabase client
const supabase = createClient(
  'https://rauhggtfprbbnrbfdpqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdWhnZ3RmcHJiYm5yYmZkcHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDgyMDksImV4cCI6MjA3NjU4NDIwOX0.o7AM8E3HVNklgqt0BKbEuxlQ0T8QP_Ky9vW0tm1zfWw'
);

// --- NOWY IMPORT ---
// Importujemy serwis geokodowania, który stworzyliśmy

// --- KONIEC NOWEGO IMPORTU ---

dotenv.config();

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;

// Konfiguracja puli bazy danych
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Testowanie połączenia z bazą
db.connect((err, client, release) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err.stack);
  } else {
    console.log('Połączono z bazą danych PostgreSQL');
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        console.error('Błąd przy zapytaniu testowym:', err.stack);
      } else {
        console.log('Test query result:', result.rows[0].now);
      }
    });
  }
});

// Middlewares
app.use(express.json()); // Do parsowania JSON
app.use(helmet()); // Podstawowe zabezpieczenia
app.use(compression()); // Kompresja odpowiedzi
app.use(morgan('dev')); // Logowanie żądań w trybie dev

// Konfiguracja CORS (z naszej poprzedniej poprawki)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Niedozwolone przez CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Obsługa zapytań pre-flight

// Prosta walidacja
// Prosta walidacja
const validateParkingLot = [
  body('name').notEmpty().withMessage('Nazwa jest wymagana'),
  body('address').notEmpty().withMessage('Adres jest wymagany'),
  body('city').notEmpty().withMessage('Miasto jest wymagane'),
  body('price_per_hour').isNumeric().withMessage('Cena musi być liczbą'),
  body('total_spots').isNumeric().withMessage('Liczba miejsc musi być liczbą'),
];

const validateUser = [
  body('email').isEmail().withMessage('Niepoprawny email'),
  body('password').isLength({ min: 6 }).withMessage('Hasło musi mieć min. 6 znaków'),
  body('username').notEmpty().withMessage('Nazwa użytkownika jest wymagana'),
];

// Funkcja pomocnicza do walidacji
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Nieprawidłowy token' });
    }
    req.user = user;
    next();
  });
};

// Walidacja rejestracji
const validateRegister = [
  body('email').isEmail().withMessage('Nieprawidłowy email'),
  body('password').isLength({ min: 6 }).withMessage('Hasło musi mieć min. 6 znaków'),
  body('full_name').notEmpty().withMessage('Imię i nazwisko są wymagane'),
];

// Walidacja logowania
const validateLogin = [
  body('email').isEmail().withMessage('Nieprawidłowy email'),
  body('password').notEmpty().withMessage('Hasło jest wymagane'),
];
// ===================================
// API ROUTES
// ===================================

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// -------------------
// Parking Lots API
// -------------------

// Get all parking lots (z filtrowaniem)
// Get all parking lots (z filtrowaniem)
app.get('/api/lots', async (req, res) => {
  console.log("Lots endpoint - używam Supabase");
  try {
    const { city } = req.query;
    
    let query = supabase
      .from('parking_lots')
      .select('*')
      .eq('status', 'active');
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    res.json({ lots: data || [] });
  } catch (error) {
    console.error('Error fetching parking lots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single parking lot by ID
app.get('/api/lots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM parking_lots WHERE lot_id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching parking lot:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// ===================================
// AUTH ENDPOINTS
// ===================================

// Rejestracja
app.post('/api/auth/register', validateRegister, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Sprawdź czy użytkownik już istnieje
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik o tym emailu już istnieje' });
    }

    // Hashuj hasło
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Utwórz użytkownika
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash,
        full_name,
        phone: phone || null,
        role: 'driver',
        status: 'active'
      }])
      .select('id, email, full_name, role')
      .single();

    if (error) throw error;

    // Utwórz reputację użytkownika
    await supabase
      .from('user_reputation')
      .insert([{
        user_id: newUser.id,
        score: 0,
        reports_total: 0,
        reports_confirmed: 0,
        reports_rejected: 0
      }]);

    // Generuj JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Rejestracja udana',
      token,
      user: newUser
    });

  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

// Logowanie
app.post('/api/auth/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Znajdź użytkownika
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, role, status')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Sprawdź status konta
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Konto nieaktywne' });
    }

    // Sprawdź hasło
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Generuj JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    // Usuń hasło z odpowiedzi
    delete user.password_hash;

    res.json({
      message: 'Logowanie udane',
      token,
      user
    });

  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

// Pobierz profil użytkownika (chroniony endpoint)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, wallet_address, role, status, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

// Aktualizuj profil użytkownika
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone } = req.body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ full_name, phone })
      .eq('id', req.user.id)
      .select('id, email, full_name, phone, role')
      .single();

    if (error) throw error;

    res.json({
      message: 'Profil zaktualizowany',
      user: updatedUser
    });

  } catch (error) {
    console.error('Błąd aktualizacji profilu:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});
// --- CAŁA PONIŻSZA SEKCJA `app.post` ZOSTAŁA ZASTĄPIONA --- //
// Create a new parking lot (z Geokodowaniem)
app.post('/api/lots', validateParkingLot, handleValidationErrors, async (req, res) => {
  console.log("POST /api/lots - dodawanie parkingu");
  console.log("Otrzymane dane:", req.body);

  try {
    const { name, address, city, price_per_hour, total_spots, description } = req.body;

    // Geokodowanie adresu
    const fullAddress = `${address}, ${city}, Polska`;
    const coords = await geocodeAddress(fullAddress);

    if (!coords) {
      return res.status(400).json({ 
        message: 'Nie udało się znaleźć adresu. Sprawdź poprawność danych.' 
      });
    }

    // Dodaj parking do Supabase
    const { data, error } = await supabase
      .from('parking_lots')
      .insert([{
        name,
        address,
        city,
        latitude: coords.latitude,
        longitude: coords.longitude,
        capacity: total_spots,
        current_occupancy: 0,
        hourly_rate: price_per_hour,
        description: description || null,
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ message: error.message, error });
    }

    console.log('✅ Parking dodany:', data);
    res.status(201).json(data);

  } catch (error) {
    console.error('❌ Error creating parking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// <-- ZMIENIONE
// Create a new parking lot (z Geokodowaniem)
// Create a new parking lot (z Supabase)
// Create a new parking lot (z Supabase)
// Create a new parking lot (z Geokodowaniem)
// ============================================
// RESERVATIONS ENDPOINTS (Supabase)
// ============================================

// Create reservation
// ============================================
// RESERVATIONS ENDPOINTS (Supabase)
// ============================================

// Create reservation
app.post('/api/reservations', authenticateToken, async (req, res) => {
  console.log("POST /api/reservations - tworzenie rezerwacji");
  console.log("User:", req.user);
  console.log("Otrzymane dane:", req.body);

  try {
    const { lot_id, start_time, end_time, license_plate, price } = req.body;

    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        lot_id,
        user_id: req.user.id, // Teraz mamy prawdziwego użytkownika!
        start_time,
        end_time,
        license_plate,
        price,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ message: error.message, error });
    }

    console.log('✅ Rezerwacja utworzona:', data);
    res.status(201).json(data);

  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Update a parking lot
app.put('/api/lots/:id', validateParkingLot, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      country,
      latitude,
      longitude,
      price_per_hour,
      total_spots,
      available_spots,
      description,
      is_active
    } = req.body;

    // W przyszłości, jeśli adres się zmieni, tutaj też powinniśmy wywołać geokoder!
    // Na razie prosta aktualizacja.
    
    const updatedLot = await db.query(
      `UPDATE parking_lots
       SET name = $1, address = $2, city = $3, country = $4, latitude = $5, longitude = $6,
           price_per_hour = $7, total_spots = $8, available_spots = $9, description = $10, is_active = $11
       WHERE lot_id = $12 RETURNING *`,
      [
        name, address, city, country, latitude, longitude,
        price_per_hour, total_spots, available_spots, description, is_active,
        id
      ]
    );

    if (updatedLot.rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    res.json(updatedLot.rows[0]);
  } catch (error) {
    console.error('Error updating parking lot:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a parking lot (soft delete)
app.delete('/api/lots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Lepsze niż usuwanie jest deaktywowanie
    const deletedLot = await db.query(
      "UPDATE parking_lots SET is_active = false WHERE lot_id = $1 RETURNING *",
      [id]
    );
    
    if (deletedLot.rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    res.status(200).json({ message: 'Parking lot deactivated', lot: deletedLot.rows[0] });
  } catch (error) {
    console.error('Error deleting parking lot:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// -------------------
// Users API
// -------------------

// Register a new user
app.post('/api/users/register', validateUser, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone } = req.body;
    
    // W produkcji: hashowanie hasła!
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    const hashedPassword = password; // Uproszczenie dla dev! TODO: Poprawić!

    const newUser = await db.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, username, email`,
      [username, email, hashedPassword, first_name, last_name, phone]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unikalny klucz
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    
    // W produkcji: porównywanie hashowanych haseł!
    // const isMatch = await bcrypt.compare(password, user.password_hash);
    const isMatch = (password === user.password_hash); // Uproszczenie! TODO: Poprawić!

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // W produkcji: generowanie tokena JWT
    // const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const token = `fake-jwt-token-for-${user.user_id}`; // Uproszczenie!

    res.json({ 
      token, 
      user: { 
        id: user.user_id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile (TODO: Wymaga autentykacji middleware)
app.get('/api/users/profile', async (req, res) => {
  // TODO: Dodać middleware sprawdzające token JWT
  const userId = '...'; // Pobrać z tokena
  try {
    const { rows } = await db.query(
      'SELECT user_id, username, email, first_name, last_name, phone, solana_wallet, created_at FROM users WHERE user_id = $1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// -------------------
// Reservations API
// -------------------

// Create a reservation
// ===================================
// USER RESERVATIONS ENDPOINTS
// ===================================

// Pobierz moje rezerwacje
app.get('/api/reservations/my', authenticateToken, async (req, res) => {
  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        *,
        parking_lots (
          id,
          name,
          address,
          city,
          hourly_rate,
          latitude,
          longitude
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ reservations });

  } catch (error) {
    console.error('Błąd pobierania rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

// Pobierz szczegóły pojedynczej rezerwacji
app.get('/api/reservations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        parking_lots (
          id,
          name,
          address,
          city,
          hourly_rate,
          latitude,
          longitude
        )
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    if (!reservation) {
      return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
    }

    res.json({ reservation });

  } catch (error) {
    console.error('Błąd pobierania rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

// Anuluj rezerwację
app.patch('/api/reservations/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Sprawdź czy rezerwacja należy do użytkownika
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*, parking_lots(current_occupancy)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !reservation) {
      return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Rezerwacja jest już anulowana' });
    }

    // Anuluj rezerwację
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Zmniejsz zajętość parkingu (jeśli trigger nie zadziałał)
    await supabase
      .from('parking_lots')
      .update({ 
        current_occupancy: Math.max((reservation.parking_lots.current_occupancy || 1) - 1, 0)
      })
      .eq('id', reservation.lot_id);

    res.json({ 
      message: 'Rezerwacja anulowana',
      reservation: updatedReservation 
    });

  } catch (error) {
    console.error('Błąd anulowania rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

// Statystyki użytkownika
app.get('/api/users/stats', authenticateToken, async (req, res) => {
  try {
    // Liczba rezerwacji
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // Aktywne rezerwacje
    const { count: activeReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .in('status', ['pending', 'active']);

    // Suma wydanych pieniędzy
    const { data: reservations } = await supabase
      .from('reservations')
      .select('price')
      .eq('user_id', req.user.id)
      .neq('status', 'cancelled');

    const totalSpent = reservations?.reduce((sum, r) => sum + (r.price || 0), 0) || 0;

    res.json({
      stats: {
        totalReservations: totalReservations || 0,
        activeReservations: activeReservations || 0,
        totalSpent: totalSpent.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Błąd pobierania statystyk:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});
// ... inne trasy (cancel reservation, get reservation by id, etc.) ...


// -------------------
// Payments & Solana API
// -------------------

// (placeholder)
app.post('/api/payments/solana/confirm', (req, res) => {
  const { signature, reservation_id } = req.body;
  // TODO: Weryfikacja transakcji na blockchainie Solana
  console.log(`Weryfikacja płatności Solana: ${signature} dla rezerwacji ${reservation_id}`);
  // TODO: Aktualizacja statusu rezerwacji na 'confirmed'
  res.json({ status: 'verified', message: 'Payment confirmed' });
});


// ===================================
// Error Handling
// ===================================

// Obsługa 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Globalny error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// ===================================
// Start Server
// ===================================

app.listen(port, () => {
  console.log(`Parkchain API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});