// Parkchain API Backend - Main Server
// Node.js + Express + PostgreSQL

const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos allowed'));
    }
  }
});

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================
// AUTH ENDPOINTS
// ============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    
    // In production, hash password with bcrypt
    const { rows } = await pool.query(
      'INSERT INTO users (email, full_name, role) VALUES ($1, $2, $3) RETURNING id, email, full_name, role',
      [email, fullName, role || 'driver']
    );
    
    const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Initialize reputation
    await pool.query(
      'INSERT INTO user_reputation (user_id) VALUES ($1)',
      [rows[0].id]
    );
    
    res.status(201).json({ user: rows[0], token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: rows[0], token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// PARKING LOTS ENDPOINTS
// ============================================

app.get('/api/lots', async (req, res) => {
  try {
    const { city, lat, lng, radius } = req.query;
    
    let query = 'SELECT * FROM parking_lots WHERE status = $1';
    let params = ['active'];
    
    if (city) {
      query += ' AND city = $2';
      params.push(city);
    }
    
    // Add geospatial query if lat/lng provided
    if (lat && lng) {
      // Simple distance calculation (for production use PostGIS)
      query += ` AND (
        6371 * acos(
          cos(radians($${params.length + 1})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($${params.length + 2})) +
          sin(radians($${params.length + 1})) * sin(radians(latitude))
        )
      ) <= $${params.length + 3}`;
      params.push(lat, lng, radius || 5); // Default 5km radius
    }
    
    const { rows } = await pool.query(query, params);
    res.json({ lots: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lots/:lotId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM parking_lots WHERE id = $1',
      [req.params.lotId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lots/:lotId/occupancy', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT capacity, current_occupancy FROM parking_lots WHERE id = $1',
      [req.params.lotId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    
    const { capacity, current_occupancy } = rows[0];
    const occupancyRate = (current_occupancy / capacity) * 100;
    
    res.json({
      capacity,
      occupied: current_occupancy,
      available: capacity - current_occupancy,
      occupancyRate: Math.round(occupancyRate),
      status: occupancyRate > 90 ? 'full' : occupancyRate > 70 ? 'filling' : 'available'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RESERVATIONS ENDPOINTS
// ============================================

app.post('/api/reservations', authenticate, async (req, res) => {
  try {
    const { lotId, startTime, endTime, licensePlate } = req.body;
    
    // Check availability
    const { rows: lotRows } = await pool.query(
      'SELECT capacity, current_occupancy, hourly_rate FROM parking_lots WHERE id = $1',
      [lotId]
    );
    
    if (lotRows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    
    const lot = lotRows[0];
    if (lot.current_occupancy >= lot.capacity) {
      return res.status(400).json({ error: 'Lot is full' });
    }
    
    // Calculate price
    const hours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
    const price = hours * lot.hourly_rate;
    
    // Create reservation
    const { rows } = await pool.query(
      `INSERT INTO reservations 
       (user_id, lot_id, start_time, end_time, license_plate, price, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
       RETURNING *`,
      [req.user.id, lotId, startTime, endTime, licensePlate, price]
    );
    
    // Update occupancy
    await pool.query(
      'UPDATE parking_lots SET current_occupancy = current_occupancy + 1 WHERE id = $1',
      [lotId]
    );
    
    // Webhook event
    await pool.query(
      `INSERT INTO webhook_events (event_type, payload) 
       VALUES ('reservation.created', $1)`,
      [JSON.stringify(rows[0])]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/reservations/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, pl.name as lot_name, pl.address 
       FROM reservations r 
       JOIN parking_lots pl ON r.lot_id = pl.id 
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    res.json({ reservations: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CROWDSCAN & INSPECTIONS ENDPOINTS
// ============================================

app.post('/api/lots/:lotId/scan', authenticate, upload.array('evidence', 5), async (req, res) => {
  try {
    const { reportedOccupancy, notes } = req.body;
    const evidenceFiles = req.files;
    
    if (!evidenceFiles || evidenceFiles.length === 0) {
      return res.status(400).json({ error: 'At least one photo/video required' });
    }
    
    // Upload files to storage (S3, Cloudinary, etc.)
    // For now, store as placeholder URLs
    const evidenceUrls = evidenceFiles.map((file, i) => 
      `https://storage.parkchain.io/${req.user.id}/${Date.now()}-${i}.${file.mimetype.split('/')[1]}`
    );
    
    // Create inspection
    const { rows } = await pool.query(
      `INSERT INTO inspections 
       (lot_id, reporter_id, reported_occupancy, evidence_urls, notes, status) 
       VALUES ($1, $2, $3, $4, $5, 'queued') 
       RETURNING *`,
      [req.params.lotId, req.user.id, reportedOccupancy, evidenceUrls, notes]
    );
    
    // Update user reputation
    await pool.query(
      `INSERT INTO user_reputation (user_id, reports_total) 
       VALUES ($1, 1) 
       ON CONFLICT (user_id) 
       DO UPDATE SET reports_total = user_reputation.reports_total + 1`,
      [req.user.id]
    );
    
    // Webhook event
    await pool.query(
      `INSERT INTO webhook_events (event_type, payload) 
       VALUES ('occupancy.verification_requested', $1)`,
      [JSON.stringify(rows[0])]
    );
    
    res.status(201).json({
      inspection: rows[0],
      message: 'Scan submitted successfully. Review in progress.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/inspections/:eventId', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, u.full_name as reporter_name, pl.name as lot_name 
       FROM inspections i 
       JOIN users u ON i.reporter_id = u.id 
       JOIN parking_lots pl ON i.lot_id = pl.id 
       WHERE i.id = $1`,
      [req.params.eventId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inspections/:eventId/confirm', authenticate, async (req, res) => {
  try {
    // Check if user is inspector
    if (req.user.role !== 'inspector' && req.user.role !== 'operator') {
      return res.status(403).json({ error: 'Only inspectors can confirm' });
    }
    
    const { result, actualOccupancy, rewardAmount } = req.body;
    
    // Update inspection
    const { rows } = await pool.query(
      `UPDATE inspections 
       SET status = 'confirmed', result = $1, actual_occupancy = $2, 
           inspector_id = $3, reviewed_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [result, actualOccupancy, req.user.id, req.params.eventId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    const inspection = rows[0];
    
    // Issue reward if confirmed as helpful
    if (result === 'ok' || result === 'discrepancy') {
      const { rows: rewardRows } = await pool.query(
        `INSERT INTO rewards 
         (user_id, inspection_id, type, amount, currency, status) 
         VALUES ($1, $2, 'credit', $3, 'PLN', 'issued') 
         RETURNING *`,
        [inspection.reporter_id, inspection.id, rewardAmount || 2.50]
      );
      
      // Webhook
      await pool.query(
        `INSERT INTO webhook_events (event_type, payload) 
         VALUES ('incentive.issued', $1)`,
        [JSON.stringify(rewardRows[0])]
      );
    }
    
    res.json({
      inspection,
      message: 'Inspection confirmed and reward issued'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// REWARDS ENDPOINTS
// ============================================

app.get('/api/rewards/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, i.lot_id 
       FROM rewards r 
       LEFT JOIN inspections i ON r.inspection_id = i.id 
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    const total = rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const unclaimed = rows.filter(r => r.status === 'issued').length;
    
    res.json({
      rewards: rows,
      summary: {
        total: total.toFixed(2),
        unclaimed,
        currency: 'PLN'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rewards/:rewardId/claim', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE rewards 
       SET status = 'claimed', claimed_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND status = 'issued' 
       RETURNING *`,
      [req.params.rewardId, req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found or already claimed' });
    }
    
    res.json({
      reward: rows[0],
      message: 'Reward claimed successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

app.get('/api/analytics/kpi', authenticate, async (req, res) => {
  try {
    // Confirmation rate
    const { rows: confirmRows } = await pool.query(
      `SELECT ROUND(100.0 * SUM(CASE WHEN result != 'unknown' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as confirmation_rate 
       FROM inspections`
    );
    
    // Average verification time
    const { rows: timeRows } = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 60) as avg_minutes 
       FROM inspections 
       WHERE status = 'confirmed'`
    );
    
    // Reward cost ratio
    const { rows: costRows } = await pool.query(
      `SELECT SUM(amount) as total_rewards FROM rewards WHERE status IN ('issued', 'claimed')`
    );
    
    res.json({
      confirmationRate: confirmRows[0].confirmation_rate || 0,
      avgVerificationMinutes: Math.round(timeRows[0].avg_minutes || 0),
      totalRewardsIssued: costRows[0].total_rewards || 0,
      currency: 'PLN'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.1.0' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Parkchain API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});