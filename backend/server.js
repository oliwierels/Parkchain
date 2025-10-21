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

// --- CAŁA PONIŻSZA SEKCJA `app.post` ZOSTAŁA ZASTĄPIONA --- //
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
app.post('/api/reservations', async (req, res) => {
  console.log("POST /api/reservations - tworzenie rezerwacji");
  console.log("Otrzymane dane:", req.body);

  try {
    const { lot_id, start_time, end_time, license_plate, price } = req.body;

    // Dodaj rezerwację do Supabase
    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        lot_id,
        user_id: null, // Tymczasowe
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

    // Zwiększ zajętość parkingu
    await supabase.rpc('increment_occupancy', { parking_id: lot_id });

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
app.post('/api/reservations', async (req, res) => {
  // TODO: Wymaga autentykacji
  try {
    const { lot_id, user_id, start_time, end_time, license_plate } = req.body;

    // TODO: Sprawdzić, czy parking ma wolne miejsca (available_spots > 0)
    // TODO: Obliczyć cenę
    const estimated_price = 10; // Przykładowa cena

    const newReservation = await db.query(
      `INSERT INTO reservations (lot_id, user_id, start_time, end_time, license_plate, estimated_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [lot_id, user_id, start_time, end_time, license_plate, estimated_price]
    );

    // TODO: Zmniejszyć available_spots w tabeli parking_lots
    
    res.status(201).json(newReservation.rows[0]);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reservations for a user
app.get('/api/reservations', async (req, res) => {
  // TODO: Wymaga autentykacji
  const { user_id } = req.query; // Powinno być z tokena
  try {
    const { rows } = await db.query(
      `SELECT r.*, p.name as parking_name, p.address as parking_address
       FROM reservations r
       JOIN parking_lots p ON r.lot_id = p.lot_id
       WHERE r.user_id = $1
       ORDER BY r.start_time DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error' });
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