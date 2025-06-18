// Minimal Express + SQLite backend for Morres Logistics MVP (ES Module version)
import express from 'express';
import sqlite3 from 'sqlite3';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

const allowedOrigins = [
  'https://morres-logistics.vercel.app',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Explicitly handle preflight requests for all routes
app.options('/*any', cors(corsOptions));

// SQLite DB setup
const db = new sqlite3.Database('morres.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS deliveries (
    trackingId TEXT PRIMARY KEY,
    customerName TEXT,
    phoneNumber TEXT,
    currentStatus TEXT,
    checkpoints TEXT, -- JSON string
    driverDetails TEXT -- JSON string
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    sessionId TEXT PRIMARY KEY,
    username TEXT,
    expiresAt INTEGER
  )`);

  db.get(`SELECT * FROM users WHERE username = ?`, ['operator'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['operator', 'password123']);
    }
  });
});

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

// Session middleware
function authenticateSession(req, res, next) {
  const sessionId = req.cookies.session_id;
  if (!sessionId) return res.status(401).json({ error: 'Missing session cookie' });
  db.get(`SELECT * FROM sessions WHERE sessionId = ?`, [sessionId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid session' });
    if (row.expiresAt < Date.now()) {
      db.run(`DELETE FROM sessions WHERE sessionId = ?`, [sessionId]);
      return res.status(401).json({ error: 'Session expired' });
    }
    req.user = { username: row.username };
    next();
  });
}

// Operator login endpoint (sets session cookie)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
    db.run(`INSERT INTO sessions (sessionId, username, expiresAt) VALUES (?, ?, ?)`, [sessionId, row.username, expiresAt], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 12
      });
      res.json({ success: true, username: row.username });
    });
  });
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
app.post('/deliveries', authenticateSession, (req, res) => {
  // Defensive: Ignore any trackingId from the client
  if ('trackingId' in req.body) {
    console.warn('[SECURITY] Client tried to set trackingId. Ignoring.');
  }
  let { customerName, phoneNumber, currentStatus, checkpoints, driverDetails } = req.body;

  // 1. Validate input
  if (!customerName || !phoneNumber || !currentStatus) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!validateZimPhone(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid Zimbabwean phone number.' });
  }

  // 2. Generate unique trackingId (guaranteed unique)
  function tryInsert(trackingId, attempt = 0) {
    if (!trackingId) {
      console.error('[FATAL] Refusing to insert delivery with null or empty trackingId');
      return res.status(500).json({ error: 'Failed to generate trackingId' });
    }
    db.run(
      `INSERT INTO deliveries (trackingId, customerName, phoneNumber, currentStatus, checkpoints, driverDetails) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        trackingId,
        customerName,
        phoneNumber,
        currentStatus,
        JSON.stringify(checkpoints || []),
        JSON.stringify(driverDetails || {})
      ],
      async function (err) {
        if (err && err.message.includes('UNIQUE constraint failed') && attempt < 5) {
          return tryInsert(generateTrackingId(), attempt + 1);
        }
        if (err) {
          console.error('[DB ERROR]', err.message);
          return res.status(400).json({ error: err.message });
        }

        // 3. Send SMS to customer
        const smsMessage = `Welcome! Your delivery is created. Tracking ID: ${trackingId}. Status: ${currentStatus}`;
        const smsRes = await sendSMS(phoneNumber, smsMessage);

        // 4. Audit log
        console.log(`[AUDIT] Delivery created by ${req.user.username} at ${new Date().toISOString()} | TrackingID: ${trackingId}`);

        if (!smsRes.success) {
          return res.status(207).json({ success: true, warning: 'Delivery created, but SMS failed', trackingId, smsError: smsRes.error });
        }
        res.json({ success: true, trackingId });
      }
    );
  }

  tryInsert(generateTrackingId());
});

app.post('/updateCheckpoint', authenticateSession, async (req, res) => {
  const { trackingId, checkpoint, currentStatus } = req.body;
  db.get(`SELECT * FROM deliveries WHERE trackingId = ?`, [trackingId], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Delivery not found' });
    const checkpoints = JSON.parse(row.checkpoints);
    const newCheckpoint = { ...checkpoint, timestamp: new Date().toISOString() };
    checkpoints.push(newCheckpoint);
    db.run(
      `UPDATE deliveries SET checkpoints = ?, currentStatus = ? WHERE trackingId = ?`,
      [JSON.stringify(checkpoints), currentStatus, trackingId],
      async function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        // Send SMS
        const smsMessage = `Update: Your delivery (${trackingId}) is now at ${checkpoint.location}. Status: ${currentStatus}.`;
        const smsRes = await sendSMS(row.phoneNumber, smsMessage);
        if (!smsRes.success) {
          return res.status(207).json({ error: 'Checkpoint updated, but SMS failed', smsError: smsRes.error });
        }
        res.json({ success: true });
      }
    );
  });
});

app.get('/deliveries', authenticateSession, (req, res) => {
  db.all(`SELECT * FROM deliveries`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON fields for each row
    const deliveries = rows.map(row => ({
      ...row,
      checkpoints: JSON.parse(row.checkpoints),
      driverDetails: JSON.parse(row.driverDetails),
    }));
    res.json(deliveries);
  });
});

// Get delivery by trackingId
app.get('/deliveries/:trackingId', (req, res) => {
  db.get(`SELECT * FROM deliveries WHERE trackingId = ?`, [req.params.trackingId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Delivery not found' });
    row.checkpoints = JSON.parse(row.checkpoints);
    row.driverDetails = JSON.parse(row.driverDetails);
    res.json(row);
  });
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
app.post('/logout', authenticateSession, (req, res) => {
  const sessionId = req.cookies.session_id;
  db.run(`DELETE FROM sessions WHERE sessionId = ?`, [sessionId], () => {
    res.clearCookie('session_id');
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local API running on port ${PORT}`);
}); 