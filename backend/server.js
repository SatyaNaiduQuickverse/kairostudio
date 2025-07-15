const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Mock data for now (no database)
let contacts = [];
let contactIdCounter = 1;

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Save to memory (no database)
    const contact = {
      id: contactIdCounter++,
      name,
      email,
      phone: phone || null,
      message,
      created_at: new Date().toISOString(),
      status: 'new',
      notes: null
    };
    
    contacts.push(contact);

    res.status(201).json({ 
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      id: contact.id
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes (NO AUTH REQUIRED)
app.get('/api/admin/contacts', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0, search } = req.query;
    
    let filteredContacts = [...contacts];
    
    // Filter by status
    if (status && status !== 'all') {
      filteredContacts = filteredContacts.filter(c => c.status === status);
    }
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = filteredContacts.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.message.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date (newest first)
    filteredContacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const total = filteredContacts.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

    res.json({
      contacts: paginatedContacts,
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contact status and notes
app.patch('/api/admin/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const contactIndex = contacts.findIndex(c => c.id === parseInt(id));
    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Update contact
    if (status) contacts[contactIndex].status = status;
    if (notes !== undefined) contacts[contactIndex].notes = notes;

    res.json(contacts[contactIndex]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contact
app.delete('/api/admin/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contactIndex = contacts.findIndex(c => c.id === parseInt(id));
    
    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    contacts.splice(contactIndex, 1);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: contacts.length,
      new: contacts.filter(c => c.status === 'new').length,
      today: contacts.filter(c => new Date(c.created_at) >= today).length,
      week: contacts.filter(c => new Date(c.created_at) >= weekAgo).length,
      month: contacts.filter(c => new Date(c.created_at) >= monthAgo).length
    };

    res.json(stats);
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
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin (No auth required)`);
});
