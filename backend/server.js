// backend/server.js

import express from 'express';
import http from 'http';
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
import parkingMarketplaceRoutes from './routes/parkingMarketplaceSupabase.js';
import websocketService from './services/websocketService.js';

// Załaduj zmienne środowiskowe
dotenv.config();

// ========== MIDDLEWARE DLA RÓL ==========

// Middleware do sprawdzania roli inspektora
const isInspector = (req, res, next) => {
  if (req.user && req.user.role === 'inspector') {
    next();
  } else {
    res.status(403).json({ error: 'Brak uprawnień. Wymagana rola inspektora.' });
  }
};

// Sprawdź konfigurację Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
}

// Inicjalizacja klienta Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized');

// Note: PostgreSQL direct connection is optional
// Backend works with Supabase client only!
console.log('ℹ️  Using Supabase client for database operations');

const app = express();
const port = process.env.PORT || 3000;

// Make supabase available to routes
app.set('supabase', supabase);

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
    const { name, address, price_per_hour, total_spots, latitude, longitude, type, price_per_day, price_per_week, price_per_month, city } = req.body;
    const owner_id = req.user.id;

    const insertData = {
      name,
      address,
      price_per_hour,
      total_spots,
      available_spots: total_spots,
      latitude: latitude || null,
      longitude: longitude || null,
      owner_id,
      type: type || 'outdoor'
    };

    // Add optional fields if provided
    if (city) insertData.city = city;
    if (price_per_day) insertData.price_per_day = price_per_day;
    if (price_per_week) insertData.price_per_week = price_per_week;
    if (price_per_month) insertData.price_per_month = price_per_month;

    const { data, error } = await supabase
      .from('parking_lots')
      .insert([insertData])
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
// ========== ŁADOWARKI EV ==========

// GET /api/chargers - pobierz wszystkie ładowarki
app.get('/api/chargers', async (req, res) => {
  try {
    console.log('🔍 Fetching EV chargers from Supabase...');

    const { data, error, count } = await supabase
      .from('charging_stations')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Found EV chargers:', data?.length);
    console.log('📊 Total count in database:', count);

    if (data && data.length > 0) {
      console.log('⚡ First charger:', data[0]);
      const withCoords = data.filter(c => c.latitude && c.longitude).length;
      console.log(`📍 Chargers with coordinates: ${withCoords}/${data.length}`);
    }

    res.json({ chargers: data || [] });
  } catch (error) {
    console.error('❌ Error fetching EV chargers:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chargers - dodaj ładowarkę (BACKWARD COMPATIBILITY)
app.post('/api/chargers', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      address, 
      city,
      charger_type, 
      power_kw, 
      price_per_kwh, 
      total_connectors, 
      available_connectors,
      latitude, 
      longitude 
    } = req.body;
    const owner_id = req.user.id;
    
    const { data, error } = await supabase
      .from('charging_stations')
      .insert([{
        name,
        address,
        city: city || null,
        charger_type: charger_type || 'AC',
        max_power_kw: power_kw || 7,
        price_per_kwh: price_per_kwh || 0,
        total_connectors: total_connectors || 1,
        available_connectors: available_connectors !== undefined ? available_connectors : total_connectors || 1,
        latitude: latitude || null,
        longitude: longitude || null,
        owner_id
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating EV charger:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ev-chargers - dodaj ładowarkę (tylko dla zalogowanych)
app.post('/api/ev-chargers', authenticateToken, [
  body('name').notEmpty().withMessage('Nazwa ładowarki jest wymagana'),
  body('address').notEmpty().withMessage('Adres jest wymagany'),
  body('charger_type').isIn(['AC', 'DC', 'Tesla Supercharger']).withMessage('Nieprawidłowy typ ładowarki'),
  body('power_kw').isNumeric().withMessage('Moc musi być liczbą'),
  body('price_per_kwh').isNumeric().withMessage('Cena musi być liczbą'),
  body('total_connectors').isInt({ min: 1 }).withMessage('Liczba złączy musi być większa od 0'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      name, 
      address, 
      city,
      charger_type, 
      power_kw, 
      price_per_kwh, 
      total_connectors, 
      latitude, 
      longitude 
    } = req.body;
    const owner_id = req.user.id;
    
    const { data, error } = await supabase
      .from('charging_stations')
      .insert([{
        name,
        address,
        city: city || null,
        charger_type,
        max_power_kw: power_kw, // BACKWARD COMPATIBILITY: mapuj power_kw -> max_power_kw
        price_per_kwh,
        total_connectors,
        available_connectors: total_connectors,
        latitude: latitude || null,
        longitude: longitude || null,
        owner_id
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Created EV charger:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating EV charger:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ev-chargers/my - pobierz ładowarki zalogowanego właściciela
app.get('/api/ev-chargers/my', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ Found ${data?.length || 0} chargers for user ${req.user.id}`);
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching my EV chargers:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ev-chargers/:id - pobierz szczegóły ładowarki
app.get('/api/ev-chargers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'EV charger not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching EV charger:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/ev-chargers/:id - edytuj ładowarkę (tylko właściciel)
app.put('/api/ev-chargers/:id', authenticateToken, [
  body('name').optional().notEmpty(),
  body('address').optional().notEmpty(),
  body('charger_type').optional().isIn(['AC', 'DC', 'Tesla Supercharger']),
  body('power_kw').optional().isNumeric(),
  body('price_per_kwh').optional().isNumeric(),
  body('total_connectors').optional().isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { 
      name, 
      address, 
      city,
      charger_type, 
      power_kw, 
      price_per_kwh, 
      total_connectors, 
      latitude, 
      longitude 
    } = req.body;
    
    // Sprawdź czy ładowarka należy do użytkownika
    const { data: charger, error: fetchError } = await supabase
      .from('charging_stations')
      .select('owner_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !charger) {
      return res.status(404).json({ error: 'EV charger not found' });
    }
    
    if (charger.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized - you can only edit your own chargers' });
    }

    // Przygotuj dane do aktualizacji (tylko pola, które zostały przesłane)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (charger_type !== undefined) updateData.charger_type = charger_type;
    if (power_kw !== undefined) updateData.max_power_kw = power_kw;
    if (price_per_kwh !== undefined) updateData.price_per_kwh = price_per_kwh;
    if (total_connectors !== undefined) updateData.total_connectors = total_connectors;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Aktualizuj
    const { data, error } = await supabase
      .from('charging_stations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Updated EV charger:', data);
    res.json(data);
  } catch (error) {
    console.error('Error updating EV charger:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/ev-chargers/:id - usuń ładowarkę (tylko właściciel)
app.delete('/api/ev-chargers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy ładowarka należy do użytkownika
    const { data: charger, error: fetchError } = await supabase
      .from('charging_stations')
      .select('owner_id, name')
      .eq('id', id)
      .single();
    
    if (fetchError || !charger) {
      return res.status(404).json({ error: 'EV charger not found' });
    }
    
    if (charger.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized - you can only delete your own chargers' });
    }

    // Usuń
    const { error } = await supabase
      .from('charging_stations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log(`✅ Deleted EV charger: ${charger.name} (ID: ${id})`);
    res.json({ 
      message: 'EV charger deleted successfully',
      deleted_charger: charger.name 
    });
  } catch (error) {
    console.error('Error deleting EV charger:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/ev-chargers/:id/availability - aktualizuj dostępność złączy
app.patch('/api/ev-chargers/:id/availability', authenticateToken, [
  body('available_connectors').isInt({ min: 0 }).withMessage('Liczba dostępnych złączy musi być większa lub równa 0')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { available_connectors } = req.body;
    
    // Sprawdź czy ładowarka istnieje i pobierz total_connectors
    const { data: charger, error: fetchError } = await supabase
      .from('charging_stations')
      .select('owner_id, total_connectors')
      .eq('id', id)
      .single();
    
    if (fetchError || !charger) {
      return res.status(404).json({ error: 'EV charger not found' });
    }
    
    if (charger.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Sprawdź czy liczba dostępnych nie przekracza całkowitej
    if (available_connectors > charger.total_connectors) {
      return res.status(400).json({ 
        error: `Available connectors (${available_connectors}) cannot exceed total connectors (${charger.total_connectors})` 
      });
    }

    // Aktualizuj dostępność
    const { data, error } = await supabase
      .from('charging_stations')
      .update({ available_connectors })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Updated availability for charger ${id}: ${available_connectors}/${charger.total_connectors}`);
    res.json(data);
  } catch (error) {
    console.error('Error updating charger availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ev-chargers/search - wyszukaj ładowarki z filtrami
app.get('/api/ev-chargers/search', async (req, res) => {
  try {
    const {
      city,
      charger_type,
      min_power,
      max_price,
      available_only
    } = req.query;

    let query = supabase.from('charging_stations').select('*');

    // Filtry
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (charger_type) {
      query = query.eq('charger_type', charger_type);
    }

    if (min_power) {
      query = query.gte('max_power_kw', parseFloat(min_power));
    }

    if (max_price) {
      query = query.lte('price_per_kwh', parseFloat(max_price));
    }

    if (available_only === 'true') {
      query = query.gt('available_connectors', 0);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`🔍 Search results: ${data?.length || 0} chargers found`);
    res.json(data || []);
  } catch (error) {
    console.error('Error searching EV chargers:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/charging-stations - dodaj ładowarkę (nowy format z AddChargingStationModal)
app.post('/api/charging-stations', authenticateToken, [
  body('name').notEmpty().withMessage('Nazwa ładowarki jest wymagana'),
  body('address').notEmpty().withMessage('Adres jest wymagany'),
  body('charger_type').notEmpty().withMessage('Typ ładowarki jest wymagany'),
  body('max_power_kw').isNumeric().withMessage('Moc musi być liczbą'),
  body('price_per_kwh').isNumeric().withMessage('Cena musi być liczbą'),
  body('total_connectors').isInt({ min: 1 }).withMessage('Liczba złączy musi być większa od 0'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Nieprawidłowa szerokość geograficzna'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Nieprawidłowa długość geograficzna')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      address,
      city,
      charger_type,
      max_power_kw,
      connector_types,
      price_per_kwh,
      price_per_minute,
      price_per_session,
      total_connectors,
      latitude,
      longitude
    } = req.body;
    const owner_id = req.user.id;

    console.log('📝 Dane ładowarki do zapisania:', req.body);

    // Wstaw dane do tabeli charging_stations
    const { data, error } = await supabase
      .from('charging_stations')
      .insert([{
        name,
        address,
        city: city || null,
        charger_type,
        connector_types: connector_types || ['Type2'],
        max_power_kw,
        price_per_kwh,
        price_per_minute: price_per_minute || null,
        price_per_session: price_per_session || null,
        total_connectors,
        available_connectors: total_connectors,
        latitude,
        longitude,
        owner_id
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Błąd Supabase:', error);
      throw error;
    }

    console.log('✅ Ładowarka utworzona:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Błąd przy tworzeniu ładowarki:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/charging-stations - pobierz wszystkie ładowarki (dla frontendu)
app.get('/api/charging-stations', async (req, res) => {
  try {
    console.log('🔍 Fetching charging stations from Supabase...');

    const { data, error, count } = await supabase
      .from('charging_stations')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Found charging stations:', data?.length);
    console.log('📊 Total count in database:', count);

    if (data && data.length > 0) {
      console.log('⚡ First charging station:', data[0]);
      const withCoords = data.filter(c => c.latitude && c.longitude).length;
      console.log(`📍 Charging stations with coordinates: ${withCoords}/${data.length}`);
    }

    res.json({ stations: data || [] });
  } catch (error) {
    console.error('❌ Error fetching charging stations:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SESJE ŁADOWANIA ==========

// POST /api/charging-sessions - rozpocznij sesję ładowania
app.post('/api/charging-sessions', authenticateToken, [
  body('station_id').notEmpty().withMessage('ID stacji jest wymagane'),
  body('vehicle_info').optional().isObject()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { station_id, vehicle_info } = req.body;
    const user_id = req.user.id;

    console.log(`🔌 Starting charging session - Station ID: ${station_id}, User ID: ${user_id}`);

    // Sprawdź czy stacja istnieje i jest dostępna
    const { data: station, error: stationError } = await supabase
      .from('charging_stations')
      .select('*')
      .eq('id', station_id)
      .maybeSingle();

    if (stationError) {
      console.error('❌ Error fetching station:', stationError);
      throw stationError;
    }

    if (!station) {
      console.error(`❌ Station not found: ${station_id}`);
      return res.status(404).json({ error: 'Stacja ładowania nie znaleziona' });
    }

    console.log(`✅ Station found: ${station.name}, Available connectors: ${station.available_connectors}`);

    if (station.available_connectors <= 0) {
      console.error(`❌ No available connectors at station ${station_id}`);
      return res.status(400).json({ error: 'Brak dostępnych złączy' });
    }

    // Utwórz sesję ładowania
    const sessionData = {
      station_id,
      user_id,
      start_time: new Date().toISOString(),
      status: 'active',
      vehicle_info: vehicle_info || null,
      energy_delivered_kwh: 0,
      points_earned: 0
    };

    console.log('📝 Creating session with data:', sessionData);

    const { data, error } = await supabase
      .from('charging_sessions')
      .insert([sessionData])
      .select(`
        *,
        charging_stations (
          id,
          name,
          address,
          city,
          charger_type,
          max_power_kw,
          price_per_kwh
        ),
        users (
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }

    console.log('✅ Charging session created successfully:', data.id);

    // Zmniejsz dostępne złącza
    const { error: updateError } = await supabase
      .from('charging_stations')
      .update({ available_connectors: station.available_connectors - 1 })
      .eq('id', station_id);

    if (updateError) {
      console.error('⚠️ Warning: Could not update available connectors:', updateError);
    }

    console.log('✅ Session created and station updated. Session ID:', data.id);

    // Broadcast new session through WebSocket if available
    const websocketService = req.app.get('websocketService');
    if (websocketService && typeof websocketService.broadcast === 'function') {
      websocketService.broadcast('charging_session_started', {
        session: data,
        timestamp: new Date().toISOString()
      });
      console.log('📡 Broadcasted session start via WebSocket');
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Error creating charging session:', error);
    res.status(500).json({
      error: error.message,
      details: error.details || error.hint || null
    });
  }
});

// GET /api/live-sessions - PUBLIC endpoint for live charging feed (DeCharge hackathon)
app.get('/api/live-sessions', async (req, res) => {
  try {
    // Get all active charging sessions
    const { data: sessions, error } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_stations (
          id,
          name,
          address,
          city,
          charger_type,
          max_power_kw,
          price_per_kwh
        ),
        users (
          id,
          full_name
        )
      `)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Calculate live stats
    const stats = {
      activeSessions: sessions?.length || 0,
      totalEnergyNow: sessions?.reduce((sum, s) => sum + (parseFloat(s.energy_delivered_kwh) || 0), 0) || 0,
      totalPointsEarned: sessions?.reduce((sum, s) => sum + (s.points_earned || 0), 0) || 0,
      activeChargers: new Set(sessions?.map(s => s.station_id)).size || 0
    };

    // Anonymize user data for privacy
    const anonymizedSessions = sessions?.map(s => ({
      ...s,
      users: {
        id: null, // Don't expose user ID
        full_name: s.users?.full_name ? s.users.full_name.charAt(0) + '***' : 'Anonymous'
      }
    })) || [];

    res.json({
      sessions: anonymizedSessions,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/charging-sessions/my - pobierz moje sesje ładowania
app.get('/api/charging-sessions/my', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_stations (
          id,
          name,
          address,
          city,
          charger_type,
          max_power_kw,
          price_per_kwh,
          price_per_minute,
          price_per_session
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} sessions for user ${req.user.id}`);
    res.json({ sessions: data || [] });
  } catch (error) {
    console.error('Error fetching charging sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/charging-sessions/:id/end - zakończ sesję ładowania
app.put('/api/charging-sessions/:id/end', authenticateToken, [
  body('energy_delivered_kwh').optional().isFloat({ min: 0 }),
  body('charging_duration_minutes').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { energy_delivered_kwh, charging_duration_minutes } = req.body;

    // Sprawdź czy sesja należy do użytkownika
    const { data: session, error: fetchError } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_stations (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Sesja nie znaleziona' });
    }

    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Sesja już zakończona' });
    }

    // Oblicz koszt
    const station = session.charging_stations;
    let total_cost = 0;

    if (energy_delivered_kwh) {
      total_cost += energy_delivered_kwh * parseFloat(station.price_per_kwh);
    }

    if (charging_duration_minutes && station.price_per_minute) {
      total_cost += charging_duration_minutes * parseFloat(station.price_per_minute);
    }

    if (station.price_per_session) {
      total_cost += parseFloat(station.price_per_session);
    }

    // Punkty = kWh (zaokrąglone)
    const points_earned = Math.round(energy_delivered_kwh || 0);

    // Zaktualizuj sesję - ustaw status na pending_verification
    // Właściciel musi zweryfikować wartości przed finalizacją
    const { data, error } = await supabase
      .from('charging_sessions')
      .update({
        end_time: new Date().toISOString(),
        energy_delivered_kwh: energy_delivered_kwh || null,
        charging_duration_minutes: charging_duration_minutes || null,
        total_cost: total_cost.toFixed(2),
        points_earned,
        status: 'pending_verification', // ZMIENIONO: czeka na weryfikację właściciela
        payment_status: 'pending'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // NIE zwalniamy złącza - to zrobi właściciel po weryfikacji
    // Zapobiega to oszustwom (użytkownik podaje mniej kWh niż faktycznie pobrał)

    console.log('✅ Ended charging session (pending verification):', data);
    res.json(data);
  } catch (error) {
    console.error('Error ending charging session:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/charging-sessions/:id/verify - właściciel weryfikuje i zatwierdza sesję
app.put('/api/charging-sessions/:id/verify', authenticateToken, [
  body('energy_delivered_kwh').isFloat({ min: 0 }),
  body('charging_duration_minutes').optional().isInt({ min: 0 }),
  body('approved').isBoolean()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { energy_delivered_kwh, charging_duration_minutes, approved } = req.body;

    // Pobierz sesję wraz ze stacją
    const { data: session, error: fetchError } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_stations (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Sesja nie znaleziona' });
    }

    // Sprawdź czy użytkownik jest właścicielem stacji
    if (session.charging_stations.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Brak uprawnień - musisz być właścicielem ładowarki' });
    }

    if (session.status !== 'pending_verification') {
      return res.status(400).json({ error: 'Sesja nie oczekuje na weryfikację' });
    }

    if (!approved) {
      // Właściciel odrzucił - anuluj sesję
      const { data, error } = await supabase
        .from('charging_sessions')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Zwolnij złącze
      await supabase
        .from('charging_stations')
        .update({
          available_connectors: session.charging_stations.available_connectors + 1
        })
        .eq('id', session.station_id);

      console.log('❌ Session rejected by owner:', data);
      return res.json(data);
    }

    // Właściciel zatwierdził - oblicz finalny koszt na podstawie zweryfikowanych wartości
    const station = session.charging_stations;
    let total_cost = 0;

    if (energy_delivered_kwh) {
      total_cost += energy_delivered_kwh * parseFloat(station.price_per_kwh);
    }

    if (charging_duration_minutes && station.price_per_minute) {
      total_cost += charging_duration_minutes * parseFloat(station.price_per_minute);
    }

    if (station.price_per_session) {
      total_cost += parseFloat(station.price_per_session);
    }

    const points_earned = Math.round(energy_delivered_kwh || 0);

    // Zaktualizuj sesję - teraz już completed
    const { data, error } = await supabase
      .from('charging_sessions')
      .update({
        energy_delivered_kwh: energy_delivered_kwh,
        charging_duration_minutes: charging_duration_minutes || null,
        total_cost: total_cost.toFixed(2),
        points_earned,
        status: 'completed',
        payment_status: 'pending'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Teraz zwolnij złącze
    await supabase
      .from('charging_stations')
      .update({
        available_connectors: station.available_connectors + 1
      })
      .eq('id', session.station_id);

    console.log('✅ Session verified and completed by owner:', data);
    res.json(data);
  } catch (error) {
    console.error('Error verifying charging session:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reservations - pobierz wszystkie rezerwacje (admin)
app.get('/api/reservations', authenticateToken, async (req, res) => {
  try {
    // Pobierz rezerwacje
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (resError) throw resError;

    if (!reservations || reservations.length === 0) {
      return res.json([]);
    }

    // Pobierz unikalne ID parkingów i użytkowników
    const parkingIds = [...new Set(reservations.map(r => r.lot_id))];
    const userIds = [...new Set(reservations.map(r => r.user_id))];

    // Pobierz dane parkingów
    const { data: parkings, error: parkError } = await supabase
      .from('parking_lots')
      .select('id, name, address')
      .in('id', parkingIds);

    if (parkError) throw parkError;

    // Pobierz dane użytkowników
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);

    if (userError) throw userError;

    // Połącz dane
    const parkingMap = {};
    parkings?.forEach(p => { parkingMap[p.id] = p; });

    const userMap = {};
    users?.forEach(u => { userMap[u.id] = u; });

    const result = reservations.map(r => ({
      ...r,
      parking_lots: parkingMap[r.lot_id] || null,
      users: userMap[r.user_id] || null
    }));

    res.json(result);
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
    const {
      lot_id,
      start_time,
      end_time,
      license_plate,
      pricing_type,
      payment_method,
      payment_signature,
      payment_status
    } = req.body;
    const user_id = req.user.id;

    console.log('📝 Dane rezerwacji:', { lot_id, start_time, end_time, license_plate, pricing_type, payment_method, payment_status });

    // Sprawdź dostępność i pobierz cenę
    const { data: parking, error: parkingError } = await supabase
      .from('parking_lots')
      .select('available_spots, price_per_hour, price_per_day, price_per_week, price_per_month')
      .eq('id', lot_id)
      .single();

    if (parkingError || !parking) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }

    if (parking.available_spots <= 0) {
      return res.status(400).json({ error: 'No available spots' });
    }

    // WAŻNE: Oblicz cenę bazując na pricing_type
    const hours = (new Date(end_time) - new Date(start_time)) / (1000 * 60 * 60);
    const days = hours / 24;
    const weeks = days / 7;
    const months = days / 30;

    let price = 0;

    switch (pricing_type) {
      case 'hourly':
        price = hours * (parking.price_per_hour || 0);
        break;
      case 'daily':
        price = Math.ceil(days) * (parking.price_per_day || parking.price_per_hour * 24);
        break;
      case 'weekly':
        price = Math.ceil(weeks) * (parking.price_per_week || parking.price_per_hour * 24 * 7);
        break;
      case 'monthly':
        price = Math.ceil(months) * (parking.price_per_month || parking.price_per_hour * 24 * 30);
        break;
      default:
        price = hours * (parking.price_per_hour || 0);
    }

    console.log('💰 Obliczona cena:', price, 'zł (', pricing_type, ')');

    // Przygotuj dane rezerwacji
    const reservationData = {
      user_id,
      lot_id,
      start_time,
      end_time,
      license_plate: license_plate || null,
      price: price,
      status: payment_status === 'paid' ? 'active' : 'pending'
    };

    // Dodaj opcjonalne pola jeśli istnieją
    if (pricing_type) reservationData.pricing_type = pricing_type;
    if (payment_method) reservationData.payment_method = payment_method;
    if (payment_signature) reservationData.payment_tx = payment_signature;

    // Stwórz rezerwację
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservationData])
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

    console.log('✅ Rezerwacja utworzona:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reservations/my - pobierz rezerwacje użytkownika
app.get('/api/reservations/my', authenticateToken, async (req, res) => {
  try {
    // Pobierz rezerwacje użytkownika
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (resError) throw resError;

    if (!reservations || reservations.length === 0) {
      return res.json({ reservations: [] });
    }

    // Pobierz unikalne ID parkingów
    const parkingIds = [...new Set(reservations.map(r => r.lot_id))];

    // Pobierz dane parkingów
    const { data: parkings, error: parkError } = await supabase
      .from('parking_lots')
      .select('id, name, address, city')
      .in('id', parkingIds);

    if (parkError) throw parkError;

    // Połącz dane
    const parkingMap = {};
    parkings?.forEach(p => { parkingMap[p.id] = p; });

    const result = reservations.map(r => ({
      ...r,
      parking_lots: parkingMap[r.lot_id] || null
    }));

    res.json({ reservations: result }); // WAŻNE: zwraca { reservations: [...] }
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

app.get('/health', async (req, res) => {
  try {
    // Test tabeli charging_stations
    const { data, error } = await supabase
      .from('charging_stations')
      .select('id')
      .limit(1);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        charging_stations_table: error ? `ERROR: ${error.message}` : 'EXISTS',
        charging_stations_count: data ? data.length : 0
      }
    });
  } catch (err) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        charging_stations_table: `CATCH ERROR: ${err.message}`
      }
    });
  }
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

app.post('/api/inspections', authenticateToken, async (req, res) => {
  const { lot_id, reported_occupancy } = req.body;
  const reporter_id = req.user.id; // ID z tokena JWT

  if (!lot_id || reported_occupancy == null) {
    return res.status(400).json({ error: 'Brakuje lot_id lub reported_occupancy' });
  }

  try {
    const { data, error } = await supabase
      .from('inspections')
      .insert({
        lot_id: lot_id,
        reporter_id: reporter_id,
        reported_occupancy: reported_occupancy,
        status: 'queued' // Ustawia status na "oczekujący"
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Błąd przy tworzeniu inspekcji:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== INSPEKCJE (CROWDSCAN) ==========

// 1. ZGŁASZANIE (dla kierowcy)
// Używamy 'authenticateToken' (to jest POPRAWNA nazwa)




// 2. POBIERANIE ZGŁOSZEŃ (dla inspektora)
// Używamy 'authenticateToken' ORAZ 'isInspector'
app.get('/api/inspections/queued', [authenticateToken, isInspector], async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        parking_lots ( name )
      `)
      .eq('status', 'queued')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    const formattedData = data.map(item => ({
      ...item,
      parking_name: item.parking_lots?.name || 'Nieznany parking'
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Błąd przy pobieraniu inspekcji:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. WERYFIKACJA ZGŁOSZENIA (przez inspektora)
app.put('/api/inspections/:id', [authenticateToken, isInspector], async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 
  const inspector_id = req.user.id;

  if (status !== 'confirmed' && status !== 'rejected') {
    return res.status(400).json({ error: 'Nieprawidłowy status. Oczekiwano "confirmed" lub "rejected"' });
  }

  try {
    const { data: inspection, error: updateError } = await supabase
      .from('inspections')
      .update({
        status: status,
        inspector_id: inspector_id,
        reviewed_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!inspection) throw new Error('Nie znaleziono inspekcji');

    if (status === 'confirmed') {
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert({
          user_id: inspection.reporter_id,
          inspection_id: id,
          type: 'credit',
          amount: 5.00, 
          currency: 'PLN',
          status: 'issued'
        });
      
      if (rewardError) {
        console.error("Błąd przy tworzeniu nagrody:", rewardError);
      }
    }
    
    res.json(inspection); 

  } catch (error) {
    console.error('Błąd przy weryfikacji inspekcji:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. REPUTACJA (dla profilu zalogowanego użytkownika)
app.get('/api/reputation/me', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_reputation')
      .select('*')
      .eq('user_id', req.user.id)
      .single(); 

    if (error && error.code !== 'PGRST116') { 
      throw error;
    }

    if (!data) {
      return res.json({
        user_id: req.user.id,
        score: 0,
        reports_total: 0,
        reports_confirmed: 0,
        reports_rejected: 0
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Błąd przy pobieraniu reputacji:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SOLANA MARKETPLACE ENDPOINTS
// ==========================================

// POST /api/points/purchase - zapisz zakup DCP tokenów z Solana
app.post('/api/points/purchase', authenticateToken, [
  body('amount').isFloat({ min: 1, max: 10000 }),
  body('priceSOL').isString(),
  body('txSignature').isString().isLength({ min: 64, max: 128 }),
  body('walletAddress').isString().isLength({ min: 32, max: 44 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, priceSOL, txSignature, walletAddress } = req.body;

  try {
    console.log(`💰 Recording DCP purchase: ${amount} DCP for ${priceSOL} SOL by user ${req.user.id}`);

    // Sprawdź czy ta transakcja nie została już zapisana (prevent duplicates)
    const { data: existing, error: checkError } = await supabase
      .from('dcp_purchases')
      .select('id')
      .eq('tx_signature', txSignature)
      .single();

    if (existing) {
      console.log('⚠️ Transaction already recorded:', txSignature);
      return res.status(409).json({ error: 'Transaction already recorded' });
    }

    // Zapisz zakup w bazie
    const { data, error } = await supabase
      .from('dcp_purchases')
      .insert([{
        user_id: req.user.id,
        amount: amount,
        price_sol: priceSOL,
        tx_signature: txSignature,
        wallet_address: walletAddress,
        status: 'completed',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      // Jeśli tabela nie istnieje, zwróć sukces ale zaloguj warning
      if (error.code === '42P01') {
        console.warn('⚠️ Table dcp_purchases does not exist yet. Transaction verified on blockchain but not recorded in DB.');
        return res.status(201).json({
          message: 'Purchase verified on blockchain',
          warning: 'Database table not created yet',
          txSignature
        });
      }
      throw error;
    }

    console.log('✅ Purchase recorded:', data);
    res.status(201).json(data);

  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/points/purchases - pobierz historię zakupów DCP
app.get('/api/points/purchases', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dcp_purchases')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Jeśli tabela nie istnieje, zwróć pustą tablicę
      if (error.code === '42P01') {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leaderboard - pobierz rankingi użytkowników i stacji (publiczny)
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('📊 Fetching leaderboard data...');

    // Top Users by kWh charged (completed sessions only)
    const { data: topUsers, error: usersError } = await supabase
      .from('charging_sessions')
      .select(`
        user_id,
        users (full_name),
        energy_delivered_kwh,
        points_earned
      `)
      .eq('status', 'completed')
      .order('energy_delivered_kwh', { ascending: false });

    if (usersError) throw usersError;

    // Aggregate user stats
    const userMap = {};
    topUsers?.forEach(session => {
      const userId = session.user_id;
      if (!userMap[userId]) {
        userMap[userId] = {
          user_id: userId,
          name: session.users?.full_name || 'Anonymous',
          totalKwh: 0,
          totalPoints: 0,
          sessionsCount: 0
        };
      }
      userMap[userId].totalKwh += parseFloat(session.energy_delivered_kwh) || 0;
      userMap[userId].totalPoints += session.points_earned || 0;
      userMap[userId].sessionsCount += 1;
    });

    const topUsersAggregated = Object.values(userMap)
      .sort((a, b) => b.totalKwh - a.totalKwh)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name.charAt(0) + '***', // Anonymize for privacy
        totalKwh: Math.round(user.totalKwh * 100) / 100,
        totalPoints: user.totalPoints,
        sessionsCount: user.sessionsCount
      }));

    // Top Stations by sessions count
    const { data: topStations, error: stationsError } = await supabase
      .from('charging_sessions')
      .select(`
        station_id,
        charging_stations (name, address, price_per_kwh),
        energy_delivered_kwh
      `)
      .eq('status', 'completed');

    if (stationsError) throw stationsError;

    // Aggregate station stats
    const stationMap = {};
    topStations?.forEach(session => {
      const stationId = session.station_id;
      if (!stationMap[stationId]) {
        stationMap[stationId] = {
          station_id: stationId,
          name: session.charging_stations?.name || 'Unknown Station',
          address: session.charging_stations?.address || 'Unknown',
          totalKwh: 0,
          sessionsCount: 0
        };
      }
      stationMap[stationId].totalKwh += parseFloat(session.energy_delivered_kwh) || 0;
      stationMap[stationId].sessionsCount += 1;
    });

    const topStationsAggregated = Object.values(stationMap)
      .sort((a, b) => b.sessionsCount - a.sessionsCount)
      .slice(0, 10)
      .map((station, index) => ({
        rank: index + 1,
        name: station.name,
        address: station.address,
        totalKwh: Math.round(station.totalKwh * 100) / 100,
        sessionsCount: station.sessionsCount
      }));

    console.log(`✅ Leaderboard: ${topUsersAggregated.length} users, ${topStationsAggregated.length} stations`);

    res.json({
      topUsers: topUsersAggregated,
      topStations: topStationsAggregated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// PARKING MARKETPLACE (Mastercard DeFi Hackathon)
// ========================================

app.use('/api/parking-marketplace', parkingMarketplaceRoutes);
app.use('/api/institutional-operators', parkingMarketplaceRoutes);

console.log('✅ Parking Marketplace routes registered');

// ========================================
// REVIEWS AND RATINGS SYSTEM
// ========================================

// POST /api/reviews - Create a new review
app.post('/api/reviews', authenticateToken, [
  body('target_type').isIn(['parking_lot', 'ev_charger']),
  body('target_id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().isLength({ max: 200 }),
  body('comment').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { target_type, target_id, rating, title, comment } = req.body;
    const userId = req.user.id;

    // Check if user has already reviewed this target
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this item' });
    }

    // Verify target exists
    const targetTable = target_type === 'parking_lot' ? 'parking_lots' : 'ev_chargers';
    const { data: targetExists } = await supabase
      .from(targetTable)
      .select('id')
      .eq('id', target_id)
      .maybeSingle();

    if (!targetExists) {
      return res.status(404).json({ error: 'Target not found' });
    }

    // Create review
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        user_id: userId,
        target_type,
        target_id,
        rating,
        title,
        comment
      }])
      .select('*, users(full_name, email)')
      .single();

    if (error) throw error;

    console.log(`✅ Review created for ${target_type}:${target_id} by user ${userId}`);
    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews - Get reviews for a target
app.get('/api/reviews', async (req, res) => {
  try {
    const { target_type, target_id, limit = 50, offset = 0, sort = 'recent' } = req.query;

    if (!target_type || !target_id) {
      return res.status(400).json({ error: 'target_type and target_id are required' });
    }

    let query = supabase
      .from('reviews')
      .select(`
        *,
        users(full_name),
        review_responses(*, users(full_name)),
        review_photos(photo_url)
      `)
      .eq('target_type', target_type)
      .eq('target_id', target_id);

    // Apply sorting
    if (sort === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'highest') {
      query = query.order('rating', { ascending: false });
    } else if (sort === 'lowest') {
      query = query.order('rating', { ascending: true });
    } else if (sort === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/:id - Get single review
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users(full_name),
        review_responses(*, users(full_name)),
        review_photos(photo_url)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Review not found' });

    res.json(data);

  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reviews/:id - Update review
app.put('/api/reviews/:id', authenticateToken, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().isLength({ max: 200 }),
  body('comment').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { rating, title, comment } = req.body;
    const userId = req.user.id;
    const reviewId = req.params.id;

    // Check if review belongs to user
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    // Update review
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.comment = comment;

    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select('*, users(full_name)')
      .single();

    if (error) throw error;

    console.log(`✅ Review ${reviewId} updated by user ${userId}`);
    res.json(data);

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reviews/:id - Delete review
app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;

    // Check if review belongs to user
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    console.log(`✅ Review ${reviewId} deleted by user ${userId}`);
    res.json({ message: 'Review deleted successfully' });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews/:id/helpful - Mark review as helpful
app.post('/api/reviews/:id/helpful', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;

    // Check if already marked as helpful
    const { data: existing } = await supabase
      .from('review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Remove helpful mark
      const { error } = await supabase
        .from('review_helpful')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({ message: 'Helpful mark removed', helpful: false });
    } else {
      // Add helpful mark
      const { data, error } = await supabase
        .from('review_helpful')
        .insert([{ review_id: reviewId, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      res.json({ message: 'Marked as helpful', helpful: true, data });
    }

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews/:id/response - Add operator response
app.post('/api/reviews/:id/response', authenticateToken, [
  body('response_text').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { response_text } = req.body;
    const operatorId = req.user.id;
    const reviewId = req.params.id;

    // Verify review exists
    const { data: review } = await supabase
      .from('reviews')
      .select('target_type, target_id')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify operator owns the target (parking lot or charger)
    const targetTable = review.target_type === 'parking_lot' ? 'parking_lots' : 'ev_chargers';
    const { data: target } = await supabase
      .from(targetTable)
      .select('owner_id')
      .eq('id', review.target_id)
      .single();

    if (!target || target.owner_id !== operatorId) {
      return res.status(403).json({ error: 'Not authorized to respond to this review' });
    }

    // Check if response already exists
    const { data: existingResponse } = await supabase
      .from('review_responses')
      .select('id')
      .eq('review_id', reviewId)
      .maybeSingle();

    if (existingResponse) {
      return res.status(400).json({ error: 'Response already exists for this review' });
    }

    // Create response
    const { data, error } = await supabase
      .from('review_responses')
      .insert([{
        review_id: reviewId,
        operator_id: operatorId,
        response_text
      }])
      .select('*, users(full_name)')
      .single();

    if (error) throw error;

    console.log(`✅ Response added to review ${reviewId} by operator ${operatorId}`);
    res.status(201).json(data);

  } catch (error) {
    console.error('Error adding review response:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/statistics/:target_type/:target_id - Get rating statistics
app.get('/api/reviews/statistics/:target_type/:target_id', async (req, res) => {
  try {
    const { target_type, target_id } = req.params;

    const { data, error } = await supabase
      .from('review_statistics')
      .select('*')
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .maybeSingle();

    if (error) throw error;

    res.json(data || {
      total_reviews: 0,
      average_rating: 0,
      five_star_count: 0,
      four_star_count: 0,
      three_star_count: 0,
      two_star_count: 0,
      one_star_count: 0
    });

  } catch (error) {
    console.error('Error fetching review statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ Reviews and Ratings routes registered');

// ========================================
// FAVORITES / BOOKMARKS SYSTEM
// ========================================

// POST /api/favorites - Add to favorites
app.post('/api/favorites', authenticateToken, [
  body('target_type').isIn(['parking_lot', 'ev_charger']),
  body('target_id').isUUID(),
  body('notes').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { target_type, target_id, notes } = req.body;
    const userId = req.user.id;

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Already in favorites' });
    }

    // Verify target exists
    const targetTable = target_type === 'parking_lot' ? 'parking_lots' : 'ev_chargers';
    const { data: targetExists } = await supabase
      .from(targetTable)
      .select('id')
      .eq('id', target_id)
      .maybeSingle();

    if (!targetExists) {
      return res.status(404).json({ error: 'Target not found' });
    }

    // Add to favorites
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, target_type, target_id, notes }])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Favorite added: ${target_type}:${target_id} by user ${userId}`);
    res.status(201).json(data);

  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/favorites - Get user's favorites
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type } = req.query;

    let query = supabase
      .from('favorites')
      .select(`
        *,
        parking_lots(*),
        ev_chargers(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (target_type) {
      query = query.eq('target_type', target_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format response to include the target data directly
    const formattedData = data.map(fav => ({
      ...fav,
      target: fav.target_type === 'parking_lot' ? fav.parking_lots : fav.ev_chargers
    }));

    res.json(formattedData);

  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/favorites/:id - Remove from favorites
app.delete('/api/favorites/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteId = req.params.id;

    // Check if favorite belongs to user
    const { data: favorite } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('id', favoriteId)
      .single();

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    if (favorite.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) throw error;

    console.log(`✅ Favorite ${favoriteId} removed by user ${userId}`);
    res.json({ message: 'Favorite removed successfully' });

  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/favorites/target/:target_type/:target_id - Remove by target
app.delete('/api/favorites/target/:target_type/:target_id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type, target_id } = req.params;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', target_type)
      .eq('target_id', target_id);

    if (error) throw error;

    console.log(`✅ Favorite removed: ${target_type}:${target_id} by user ${userId}`);
    res.json({ message: 'Favorite removed successfully' });

  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/favorites/check/:target_type/:target_id - Check if favorited
app.get('/api/favorites/check/:target_type/:target_id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type, target_id } = req.params;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .maybeSingle();

    if (error) throw error;

    res.json({ isFavorite: !!data, favoriteId: data?.id });

  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/favorites/:id/notes - Update favorite notes
app.put('/api/favorites/:id/notes', authenticateToken, [
  body('notes').optional()
], async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteId = req.params.id;
    const { notes } = req.body;

    // Check if favorite belongs to user
    const { data: favorite } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('id', favoriteId)
      .single();

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    if (favorite.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('favorites')
      .update({ notes })
      .eq('id', favoriteId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error updating favorite notes:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ Favorites routes registered');

// ========================================
// SUPPORT TICKET SYSTEM
// ========================================

// POST /api/support/tickets - Create new ticket
app.post('/api/support/tickets', authenticateToken, [
  body('subject').notEmpty().isLength({ max: 200 }),
  body('description').notEmpty(),
  body('category').isIn(['technical', 'billing', 'parking', 'charging', 'account', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { subject, description, category, priority } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{
        user_id: userId,
        subject,
        description,
        category,
        priority: priority || 'medium',
        status: 'open'
      }])
      .select('*, users(full_name, email)')
      .single();

    if (error) throw error;

    console.log(`✅ Support ticket created: ${data.id} by user ${userId}`);
    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/support/tickets - Get user's tickets
app.get('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = supabase
      .from('support_tickets')
      .select('*, users(full_name, email)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/support/tickets/:id - Get single ticket with messages
app.get('/api/support/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*, users(full_name, email)')
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Check authorization
    if (ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('support_ticket_messages')
      .select('*, users(full_name)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({ ...ticket, messages: messages || [] });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/support/tickets/:id/messages - Add message to ticket
app.post('/api/support/tickets/:id/messages', authenticateToken, [
  body('message').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const { message } = req.body;

    // Verify ticket belongs to user
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Add message
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .insert([{
        ticket_id: ticketId,
        user_id: userId,
        message,
        is_staff: false
      }])
      .select('*, users(full_name)')
      .single();

    if (error) throw error;

    res.status(201).json(data);

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/support/tickets/:id/status - Update ticket status
app.put('/api/support/tickets/:id/status', authenticateToken, [
  body('status').isIn(['open', 'in_progress', 'waiting', 'resolved', 'closed'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const { status } = req.body;

    // Verify ticket belongs to user
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update status
    const updateData = { status };
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ Support Tickets routes registered');

// ========================================
// USER ACTIVITY TRACKING
// ========================================

// GET /api/activity - Get user's recent activity
app.get('/api/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, activity_type } = req.query;

    let query = supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (activity_type) {
      query = query.eq('activity_type', activity_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/activity/stats - Get activity statistics
app.get('/api/activity/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get activity counts by type
    const { data, error } = await supabase
      .from('user_activity')
      .select('activity_type')
      .eq('user_id', userId);

    if (error) throw error;

    // Count activities by type
    const stats = (data || []).reduce((acc, item) => {
      acc[item.activity_type] = (acc[item.activity_type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: data?.length || 0,
      byType: stats
    });

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ User Activity routes registered');

// 404 handler - must be before server start
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

// Create HTTP server and initialize WebSocket
const server = http.createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

// Make websocketService available to routes
app.set('websocketService', websocketService);

// Start server
server.listen(port, () => {
  console.log(`🚀 Parkchain API running on port ${port}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Log WebSocket stats
  setInterval(() => {
    const stats = websocketService.getStats();
    if (stats.totalConnections > 0) {
      console.log(`📊 WebSocket Stats:`, stats);
    }
  }, 60000); // Every minute
});

export { supabase };
