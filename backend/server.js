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
// Start serwera
app.listen(port, () => {
  console.log(`🚀 Parkchain API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 404 handler - LEAVE THIS AT THE END.
// OTHERWISE YOU'LL GET NOT FOUND ERRORS ON ENDPOINTS BELOW
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

export { supabase };
