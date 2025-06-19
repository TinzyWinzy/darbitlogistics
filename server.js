// Minimal Express + PostgreSQL backend for Morres Logistics MVP (ES Module version)
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import pool from './config/database.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

const allowedOrigins = [
  'https://morres-logistics.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));

// Ensure only the correct preflight handler is present
app.options('/{*any}', cors(corsOptions));

// Helper: Send SMS via Africa's Talking
async function sendSMS(to, message) {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  const senderId = process.env.AT_SENDER_ID || 'MorresLogistics';
  const payload = new URLSearchParams({
    username,
    to,
    message,
    from: senderId,
  });
  try {
    const resp = await axios.post('https://api.africastalking.com/version1/messaging', payload, {
      headers: {
        apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return { success: true, data: resp.data };
  } catch (err) {
    return { success: false, error: err.response?.data || err.message };
  }
}

// Session middleware with updated error handling
async function authenticateSession(req, res, next) {
  const sessionId = req.cookies.session_id;
  
  if (!sessionId) {
    console.log('No session cookie found');
    return res.status(401).json({ error: 'Missing session cookie' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE session_id = $1 AND expires_at > NOW()',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      console.log('Invalid or expired session');
      await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    req.user = { username: result.rows[0].username };
    next();
  } catch (err) {
    console.error('Session auth error:', err);
    // Send more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
}

// Updated login endpoint with proper cookie settings
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12); // 12 hours
    
    await pool.query(
      'INSERT INTO sessions (session_id, username, expires_at) VALUES ($1, $2, $3)',
      [sessionId, username, expiresAt]
    );
    
    // Updated cookie settings for cross-origin
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 12, // 12 hours
      path: '/'
    });
    
    res.json({ success: true, username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: Validate Zimbabwe phone number
function validateZimPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return (
    (cleaned.length === 9 && cleaned.startsWith('7')) ||
    (cleaned.length === 10 && cleaned.startsWith('07')) ||
    (cleaned.length === 12 && cleaned.startsWith('2637')) ||
    (cleaned.length === 13 && cleaned.startsWith('2637'))
  );
}

// Helper: Generate unique tracking ID
function generateTrackingId() {
  const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
  const digits = Math.floor(1000 + Math.random() * 9000);
  return letters + digits;
}

// Improved delivery creation route
app.post('/deliveries', authenticateSession, async (req, res) => {
  let { customer_name, phone_number, current_status, checkpoints = [], driver_details = {} } = req.body;

  // 1. Validate input
  if (!customer_name || !phone_number || !current_status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!validateZimPhone(phone_number)) {
    return res.status(400).json({ error: 'Invalid Zimbabwean phone number.' });
  }

  // 2. Generate unique trackingId and try insert
  async function tryInsert(attempt = 0) {
    if (attempt >= 5) {
      return res.status(500).json({ error: 'Failed to generate unique tracking ID' });
    }

    const tracking_id = generateTrackingId();
    
    try {
      await pool.query(
        `INSERT INTO deliveries (tracking_id, customer_name, phone_number, current_status, checkpoints, driver_details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tracking_id, customer_name, phone_number, current_status, JSON.stringify(checkpoints), JSON.stringify(driver_details)]
      );

      // 3. Send SMS to customer
      const smsMessage = `Welcome! Your delivery is created. Tracking ID: ${tracking_id}. Status: ${current_status}`;
      const smsRes = await sendSMS(phone_number, smsMessage);

      // 4. Audit log
      console.log(`[AUDIT] Delivery created by ${req.user.username} at ${new Date().toISOString()} | TrackingID: ${tracking_id}`);

      if (!smsRes.success) {
        return res.status(207).json({
          success: true,
          warning: 'Delivery created, but SMS failed',
          tracking_id,
          smsError: smsRes.error
        });
      }

      res.json({ success: true, tracking_id });
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        return tryInsert(attempt + 1);
      }
      console.error('[DB ERROR]', err);
      res.status(400).json({ error: err.message });
    }
  }

  tryInsert();
});

app.post('/updateCheckpoint', authenticateSession, async (req, res) => {
  console.log('UpdateCheckpoint body:', req.body);
  const { trackingId, checkpoint, currentStatus } = req.body;
  if (!trackingId || !checkpoint || !currentStatus) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  
  try {
    const delivery = await pool.query(
      'SELECT * FROM deliveries WHERE tracking_id = $1',
      [trackingId]
    );
    
    if (delivery.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    const row = delivery.rows[0];
    // Defensive parsing of checkpoints
    let checkpoints = [];
    try {
      checkpoints = row.checkpoints ? JSON.parse(row.checkpoints) : [];
      if (!Array.isArray(checkpoints)) checkpoints = [];
    } catch (parseError) {
      console.error('Failed to parse checkpoints:', parseError);
      checkpoints = [];
    }
    
    const newCheckpoint = { ...checkpoint, timestamp: new Date().toISOString() };
    checkpoints.push(newCheckpoint);
    
    await pool.query(
      'UPDATE deliveries SET checkpoints = $1, current_status = $2 WHERE tracking_id = $3',
      [JSON.stringify(checkpoints), currentStatus, trackingId]
    );
    
    // Send SMS
    const smsMessage = `Update: Your delivery (${trackingId}) is now at ${checkpoint.location}. Status: ${currentStatus}.`;
    const smsRes = await sendSMS(row.phone_number, smsMessage);
    
    if (!smsRes.success) {
      return res.status(207).json({
        error: 'Checkpoint updated, but SMS failed',
        smsError: smsRes.error
      });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Update checkpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/deliveries', authenticateSession, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM deliveries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get deliveries error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get delivery by trackingId
app.get('/deliveries/:trackingId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM deliveries WHERE tracking_id = $1',
      [req.params.trackingId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get delivery error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a /send-initial-sms endpoint
app.post('/send-initial-sms', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'Missing to or message' });
  const smsRes = await sendSMS(to, message);
  if (!smsRes.success) {
    return res.status(500).json({ error: smsRes.error || 'Failed to send SMS' });
  }
  res.json({ success: true });
});

// Add logout endpoint
app.post('/logout', authenticateSession, async (req, res) => {
  const sessionId = req.cookies.session_id;
  try {
    await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
    res.clearCookie('session_id');
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local API running on port ${PORT}`);
}); 