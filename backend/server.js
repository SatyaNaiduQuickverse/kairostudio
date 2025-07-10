const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const pkg = require('pg');
const bcrypt = require('bcryptjs');

const { Pool } = pkg;
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'kairostudio',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Create tables on startup
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'new',
        notes TEXT
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user (password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO admin_users (username, password_hash) 
      VALUES ('admin', $1) 
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

initDB();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Strict rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

// Simple session store
const sessions = new Map();

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized - Please login' });
  }

  const session = sessions.get(sessionId);
  if (Date.now() > session.expires) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: 'Session expired' });
  }

  req.user = session.user;
  next();
};

// Generate session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Public routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kairos Studio API', 
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Kairos Studio API'
  });
});

app.get('/api/studio-info', (req, res) => {
  res.json({
    name: 'Kairos Studio',
    tagline: 'Where Time Meets Creativity',
    description: 'Professional creative studio specializing in innovative design solutions',
    services: [
      'Creative Direction',
      'Brand Design', 
      'Digital Experiences',
      'Visual Identity',
      'Motion Graphics'
    ],
    contact: {
      email: 'hello@kairostudio.in',
      phone: '+91 XXX XXX XXXX',
      address: 'Pune, Maharashtra, India'
    }
  });
});

// Contact form submission (public)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      return res.status(400).json({ error: 'Field length exceeded' });
    }

    if (phone && phone.length > 20) {
      return res.status(400).json({ error: 'Phone number too long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Save to database
    const result = await pool.query(
      'INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, phone || null, message]
    );

    res.status(201).json({ 
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login
app.post('/api/admin/login', adminLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = generateSessionId();
    const expires = Date.now() + (24 * 60 * 60 * 1000);

    sessions.set(sessionId, {
      user: { id: user.id, username: user.username },
      expires
    });

    res.json({
      success: true,
      sessionId,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.json({ success: true, message: 'Logged out' });
});

// Get all contacts (admin only)
app.get('/api/admin/contacts', adminAuth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0, search } = req.query;
    
    let query = 'SELECT * FROM contacts';
    let params = [];
    let conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(`status = ${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(name ILIKE ${params.length + 1} OR email ILIKE ${params.length + 1} OR message ILIKE ${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${params.length + 1} OFFSET ${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM contacts';
    let countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }
    
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      contacts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contact status and notes (admin only)
app.patch('/api/admin/contacts/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let query = 'UPDATE contacts SET ';
    let updates = [];
    let params = [];

    if (status) {
      updates.push(`status = ${params.length + 1}`);
      params.push(status);
    }

    if (notes !== undefined) {
      updates.push(`notes = ${params.length + 1}`);
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += updates.join(', ') + ` WHERE id = ${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contact (admin only)
app.delete('/api/admin/contacts/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM contacts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats (admin only)
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM contacts'),
      pool.query('SELECT COUNT(*) as new FROM contacts WHERE status = $1', ['new']),
      pool.query('SELECT COUNT(*) as today FROM contacts WHERE created_at::date = CURRENT_DATE'),
      pool.query('SELECT COUNT(*) as week FROM contacts WHERE created_at > NOW() - INTERVAL \'7 days\''),
      pool.query('SELECT COUNT(*) as month FROM contacts WHERE created_at > NOW() - INTERVAL \'30 days\'')
    ]);

    res.json({
      total: parseInt(stats[0].rows[0].total),
      new: parseInt(stats[1].rows[0].new),
      today: parseInt(stats[2].rows[0].today),
      week: parseInt(stats[3].rows[0].week),
      month: parseInt(stats[4].rows[0].month)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kairos Studio API running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Admin login: username: admin, password: admin123`);
});
