// Minimal Express + SQLite backend for Morres Logistics MVP (ES Module version)
import express from 'express';
import sqlite3 from 'sqlite3';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import session from 'express-session';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(bodyParser.json());

const allowedOrigins = [
  'https://morres-logistics.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'morres_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // true if using HTTPS
}));

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

// Create delivery (for operator/testing)
app.post('/deliveries', (req, res) => {
  const { trackingId, customerName, phoneNumber, currentStatus, checkpoints, driverDetails } = req.body;
  db.run(
    `INSERT INTO deliveries (trackingId, customerName, phoneNumber, currentStatus, checkpoints, driverDetails) VALUES (?, ?, ?, ?, ?, ?)`,
    [trackingId, customerName, phoneNumber, currentStatus, JSON.stringify(checkpoints || []), JSON.stringify(driverDetails || {})],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
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

// Update checkpoint and send SMS
app.post('/updateCheckpoint', async (req, res) => {
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

// Operator login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.user = { username: row.username };
    res.json({ success: true, username: row.username });
  });
});

// Add a route to check session
app.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Add a logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// List all deliveries (for operator dashboard)
app.get('/deliveries', (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Local API running on port ${PORT}`)); 