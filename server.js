// Minimal Express + PostgreSQL backend for Morres Logistics MVP (ES Module version)
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import crypto from 'crypto';
import webPush from 'web-push'; // Import web-push
import bcrypt from 'bcrypt';
import pool from './config/database.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import authRouter from './routes/auth.js';
import cookieParser from 'cookie-parser';
import { authenticateJWT } from './middleware/auth.js';
import parentBookingsRouter from './routes/parent-bookings.js';
import adminRouter from './routes/admin.js';
import { Paynow } from 'paynow';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { Parser as CsvParser } from 'json2csv';
import rateLimit from 'express-rate-limit';
import { subscriptionTiers } from './config/subscriptions.js';

dotenv.config();

// --- Ensure refresh_tokens table exists ---
(async function ensureRefreshTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

// VAPID keys for web push
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webPush.setVapidDetails(
  'mailto:hanzohanic@gmail.com', 
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

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
      console.warn(`[WARN][CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));

// Ensure only the correct preflight handler is present
app.options('/{*any}', cors(corsOptions));

const jwtSecret = process.env.JWT_SECRET || 'your-very-secret-key'; // Store securely in .env

// Replace sendSMS with TextBee implementation
async function sendSMS(to, message) {
  // Standardize the 'to' number to E.164 format
  let formattedTo = to.replace(/\D/g, ''); // Remove non-digits
  if (formattedTo.startsWith('0')) {
    formattedTo = '263' + formattedTo.substring(1);
  }
  if (!formattedTo.startsWith('+')) {
    formattedTo = `+${formattedTo}`;
  }

  const textbeeApiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  if (!deviceId) {
    throw new Error('TEXTBEE_DEVICE_ID is not set in environment variables');
  }
  try {
    const response = await axios.post(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        recipients: [formattedTo],
        message
      },
      {
        headers: {
          'x-api-key': textbeeApiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.data && response.data.data && response.data.data.success) {
      console.info(`[INFO][SMS][TextBee] SMS sent:`, response.data);
      return { success: true, provider: 'textbee', data: response.data };
    } else {
      console.error('TextBee SMS error:', response.data);
      return { success: false, error: response.data };
    }
  } catch (err) {
    console.error('TextBee SMS exception:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

// Middleware to restrict access to admins
function adminOnly(req, res, next) {
  if (
    req.user &&
    (req.user.role === 'admin' || req.user.username === 'hanzo') // Allow superuser hanzo
  ) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admins only' });
  }
}

// Middleware to check subscription quotas
function checkQuota(resource) {
  return async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    try {
      // 1. Fetch user's active/trial subscription
      const subResult = await pool.query(
        `SELECT * FROM subscriptions 
         WHERE user_id = $1 AND (status = 'active' OR status = 'trial')
         AND (end_date IS NULL OR end_date > NOW())`,
        [userId]
      );

      if (subResult.rows.length === 0) {
        return res.status(403).json({ 
          error: 'No active subscription found or your subscription has expired. Please upgrade your plan.' 
        });
      }

      const subscription = subResult.rows[0];
      const { subscriptionTiers } = await import('./config/subscriptions.js');
      const tierLimits = subscriptionTiers[subscription.tier];

      // 2. Check the specific resource quota
      let usage, limit, resourceName;
      if (resource === 'delivery') {
        usage = subscription.deliveries_used;
        limit = tierLimits.maxDeliveries;
        resourceName = 'delivery';
      } else if (resource === 'sms') {
        usage = subscription.sms_used;
        limit = tierLimits.maxSms;
        resourceName = 'SMS';
      } else {
        return res.status(500).json({ error: 'Invalid quota resource specified.' });
      }

      if (usage >= limit) {
        return res.status(403).json({
          error: `You have exceeded your monthly ${resourceName} quota.`,
          quotaExceeded: true,
          limit,
          usage,
        });
      }

      // 3. Attach subscription info to the request for the next handler to use
      req.subscription = subscription;
      next();

    } catch (err) {
      console.error('Quota check error:', err);
      res.status(500).json({ error: 'Internal server error while checking quotas.' });
    }
  };
}

// --- Refresh Token Helpers ---
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}
// --- LOGIN: Issue refresh token ---
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    console.warn(`[WARN][API][POST /login] Missing username or password`);
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      console.info(`[INFO][API][POST /login] Invalid credentials for username: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.info(`[INFO][API][POST /login] Invalid password for username: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Sanitize the user object to send to the client
    const userForClient = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '12h' }
    );
    // --- Issue refresh token ---
    const refreshToken = generateRefreshToken();
    const refreshExpiry = new Date(Date.now() + 30*24*60*60*1000); // 30 days
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
      [user.id, refreshToken, refreshExpiry]
    );
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth/refresh', maxAge: 30*24*60*60*1000 });
    res.json({ success: true, user: userForClient, token });
  } catch (err) {
    console.error(`[ERROR][API][POST /login] Login error for username: ${username} | ${err.message}`);
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

// Function to generate a unique booking code
function generateBookingCode() {
  const prefix = 'MB'; // MB for Morres Booking
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

// Helper: Generate unique booking reference
function generateBookingReference() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit number
  return `REF-${year}${month}-${random}`;
}

// Parent Booking Routes
app.post('/parent-bookings', authenticateJWT, async (req, res) => {
  const {
    customer_name,
    phone_number,
    total_tonnage,
    mineral_type,
    mineral_grade,
    loading_point,
    destination,
    deadline,
    notes,
    moisture_content,
    particle_size,
    requires_analysis,
    special_handling_notes,
    environmental_concerns,
    cost = 0 // Consignment cost
  } = req.body;

  try {
    // Generate booking code first
    const bookingCode = generateBookingCode();
    
    // Validate required fields
    if (!customer_name || !phone_number || !total_tonnage || !mineral_type || !loading_point || !destination || !deadline) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Validate phone number
    if (!validateZimPhone(phone_number)) {
      return res.status(400).json({ error: 'Invalid Zimbabwean phone number.' });
    }

    // Validate tonnage
    if (total_tonnage <= 0) {
      return res.status(400).json({ error: 'Total tonnage must be greater than 0.' });
    }

    // Validate deadline
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ error: 'Deadline must be in the future.' });
    }

    // Validate moisture content if provided
    if (moisture_content !== undefined && moisture_content !== null && (moisture_content < 0 || moisture_content > 100)) {
      return res.status(400).json({ error: 'Moisture content must be between 0 and 100%.' });
    }
    
    if (cost < 0) {
      return res.status(400).json({ error: 'Cost must be non-negative.' });
    }

    const result = await pool.query(
      `INSERT INTO parent_bookings (
        customer_name, phone_number, total_tonnage, mineral_type, mineral_grade, 
        loading_point, destination, deadline, booking_code, notes,
        moisture_content, particle_size, requires_analysis,
        special_handling_notes, environmental_concerns,
        remaining_tonnage, status, created_by_user_id, cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
      RETURNING *`,
      [
        customer_name,
        phone_number,
        total_tonnage,
        mineral_type,
        mineral_grade || 'Ungraded',
        loading_point,
        destination,
        deadline,
        bookingCode,
        notes || '',
        moisture_content,
        particle_size,
        requires_analysis || false,
        special_handling_notes,
        environmental_concerns,
        total_tonnage, // Initially, remaining_tonnage equals total_tonnage
        'Active',  // Default status
        req.user.id,
        cost
      ]
    );

    const newBooking = result.rows[0];

    // Send SMS notification
    const smsMessage = `Your booking is confirmed. Booking Code: ${bookingCode}. Total Tonnage: ${total_tonnage}. We will notify you as deliveries are dispatched.`;
    const smsRes = await sendSMS(phone_number, smsMessage);

    // Audit log
    console.info(`[AUDIT][API][POST /parent-bookings] Parent booking created by ${req.user.username} at ${new Date().toISOString()} | BookingCode: ${bookingCode}`);

    if (!smsRes.success) {
      return res.status(207).json({
        success: true,
        warning: 'Booking created, but SMS failed',
        booking: newBooking,
        smsError: smsRes.error
      });
    }

    res.json({ success: true, booking: newBooking });
  } catch (err) {
    console.error('Parent booking creation error:', err);
    // Check for specific database errors, like invalid enum value
    if (err.message.includes('invalid input value for enum mineral_type')) {
      return res.status(400).json({ error: 'Invalid mineral type.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/parent-bookings/:id/status', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    const result = await pool.query(
      'UPDATE parent_bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent booking not found.' });
    }

    console.info(`[AUDIT][API][PATCH /parent-bookings/:id/status] Parent booking ${id} status updated to ${status} by ${req.user.username}`);
    res.json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error(`[ERROR][API][PATCH /parent-bookings/:id/status] Update parent booking status error for id ${id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Add PATCH endpoint to update cost
app.patch('/parent-bookings/:id/cost', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { cost } = req.body;
  if (cost === undefined || cost < 0) {
    return res.status(400).json({ error: 'Cost must be provided and non-negative.' });
  }
  try {
    const result = await pool.query(
      'UPDATE parent_bookings SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [cost, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent booking not found.' });
    }
    res.json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error(`[ERROR][API][PATCH /parent-bookings/:id/cost] Update parent booking cost error for id ${id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Delivery Routes
app.post('/deliveries', authenticateJWT, checkQuota('delivery'), async (req, res) => {
  let { 
    customer_name, 
    phone_number, 
    current_status = 'Pending',
    parent_booking_id,
    tonnage,
    container_count,
    vehicle_type = 'Standard Truck',
    vehicle_capacity = 30.00,
    loading_point,
    destination,
    checkpoints = [], 
    driver_details = {},
    value = 0,
    cost = 0,
    custom_status = null
  } = req.body;

  // 1. Validate input
  try {
    if (!customer_name || !phone_number || !parent_booking_id || !tonnage || !container_count) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!validateZimPhone(phone_number)) {
      return res.status(400).json({ error: 'Invalid Zimbabwean phone number.' });
    }

    if (tonnage <= 0) {
      return res.status(400).json({ error: 'Tonnage must be greater than 0.' });
    }

    if (container_count < 1) {
      return res.status(400).json({ error: 'Container count must be at least 1.' });
    }

    if (!driver_details.name || !driver_details.vehicleReg) {
      return res.status(400).json({ error: 'Driver name and vehicle registration are required.' });
    }

    // 2. Verify parent booking exists and has sufficient remaining tonnage
    const parentBooking = await pool.query(
      'SELECT * FROM parent_bookings WHERE id = $1',
      [parent_booking_id]
    );

    if (parentBooking.rows.length === 0) {
      return res.status(404).json({ error: 'Parent booking not found.' });
    }

    const booking = parentBooking.rows[0];
    if (booking.remaining_tonnage < tonnage) {
      return res.status(400).json({ 
        error: `Insufficient remaining tonnage. Available: ${booking.remaining_tonnage} tons` 
      });
    }

    // 3. Generate unique trackingId and try insert
    async function tryInsert(attempt = 0) {
      if (attempt >= 5) {
        return res.status(500).json({ error: 'Failed to generate unique tracking ID' });
      }

      const tracking_id = generateTrackingId();
      const booking_reference = generateBookingReference();
      
      try {
        const result = await pool.query(
          `INSERT INTO deliveries (
            tracking_id, 
            customer_name, 
            phone_number, 
            current_status, 
            parent_booking_id,
            tonnage,
            container_count,
            vehicle_type,
            vehicle_capacity,
            loading_point,
            destination,
            booking_reference,
            checkpoints, 
            driver_details,
            created_by_user_id,
            value,
            cost,
            custom_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING *`,
          [
            tracking_id, 
            customer_name, 
            phone_number, 
            current_status, 
            parent_booking_id,
            tonnage,
            container_count,
            vehicle_type,
            vehicle_capacity,
            loading_point || booking.loading_point,
            destination || booking.destination,
            booking_reference,
            JSON.stringify(checkpoints), 
            JSON.stringify(driver_details),
            req.user.id,
            value,
            cost,
            custom_status
          ]
        );

        const newDelivery = result.rows[0];

        // Fetch mineral_type and mineral_grade from parent booking
        const parentBookingMinerals = await pool.query(
          'SELECT mineral_type, mineral_grade FROM parent_bookings WHERE id = $1',
          [parent_booking_id]
        );
        if (parentBookingMinerals.rows.length > 0) {
          newDelivery.mineral_type = parentBookingMinerals.rows[0].mineral_type;
          newDelivery.mineral_grade = parentBookingMinerals.rows[0].mineral_grade;
        }

        // 4. Increment the quota usage in the database
        await pool.query(
          'UPDATE subscriptions SET deliveries_used = deliveries_used + 1 WHERE id = $1',
          [req.subscription.id]
        );
        
        // 5. Construct and send an enhanced SMS to the customer
        const trackingId = newDelivery.tracking_id;
        const trackingBaseUrl = process.env.FRONTEND_URL || 'https://morres-logistics.vercel.app';

        const smsMessage = `Hi ${customer_name}, your delivery with tracking ID ${trackingId} has been dispatched. Track its progress here: ${trackingBaseUrl}/track-delivery?id=${trackingId}`;
        const smsRes = await sendSMS(phone_number, smsMessage);

        // 6. Audit log
        console.info(`[AUDIT][API][POST /deliveries] Delivery created by ${req.user.username} at ${new Date().toISOString()} | TrackingID: ${tracking_id}`);

        if (!smsRes.success) {
          return res.status(207).json({
            success: true,
            warning: 'Delivery created, but SMS failed',
            trackingId: tracking_id,
            delivery: newDelivery,
            smsError: smsRes.error
          });
        }

        res.json({ 
          success: true, 
          trackingId: tracking_id,
          delivery: newDelivery
        });
      } catch (err) {
        if (err.code === '23505') { // Unique violation
          return tryInsert(attempt + 1);
        }
        console.error('[DB ERROR]', err);
        res.status(400).json({ error: err.message });
      }
    }

    tryInsert();
  } catch (err) {
    console.error('Delivery creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /deliveries?limit=20&offset=0&search=foo
// Optional 'search' param filters by customer_name, tracking_id, or current_status (case-insensitive, partial match)
app.get('/deliveries', authenticateJWT, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : '';
    let baseQuery = `
      SELECT 
        d.*,
        pb.mineral_type,
        pb.mineral_grade,
        pb.created_by_user_id
      FROM 
        deliveries d
      LEFT JOIN 
        parent_bookings pb ON d.parent_booking_id = pb.id
    `;
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM deliveries d
      LEFT JOIN parent_bookings pb ON d.parent_booking_id = pb.id
    `;
    const params = [];
    const countParams = [];
    let whereClauses = [];

    // Role-based filtering
    if (req.user.role === 'operator') {
      whereClauses.push('pb.created_by_user_id = $' + (params.length + 1));
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    // Search filtering
    if (search) {
      const searchParam = `%${search}%`;
      whereClauses.push(`(
        LOWER(d.customer_name) LIKE $${params.length + 1}
        OR LOWER(d.tracking_id) LIKE $${params.length + 1}
        OR LOWER(d.current_status) LIKE $${params.length + 1}
      )`);
      params.push(searchParam);
      countParams.push(searchParam);
    }

    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ');
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    baseQuery += ' ORDER BY d.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(baseQuery, params),
      pool.query(countQuery, countParams)
    ]);
    const total = parseInt(countResult.rows[0].total, 10);
    res.json({ total, deliveries: result.rows });
  } catch (err) {
    console.error('Get deliveries error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- NEW DASHBOARD/ANALYTICS ENDPOINTS ---

// 1. Loads summary by day and customer
app.get('/deliveries/summary-by-day-customer', authenticateJWT, async (req, res) => {
  try {
    let where = '';
    let params = [];
    if (req.user.role === 'operator') {
      where = 'WHERE pb.created_by_user_id = $1';
      params.push(req.user.id);
    }
    const query = `
      SELECT 
        pb.customer_name, 
        DATE(d.created_at) AS day, 
        COUNT(*) AS deliveries_count, 
        SUM(d.tonnage) AS total_tonnage
      FROM deliveries d
      LEFT JOIN parent_bookings pb ON d.parent_booking_id = pb.id
      ${where}
      GROUP BY pb.customer_name, day
      ORDER BY day DESC, pb.customer_name
    `;
    const result = await pool.query(query, params);
    res.json({ summary: result.rows });
  } catch (err) {
    console.error('Summary by day/customer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Pending loads summary
app.get('/deliveries/pending-summary', authenticateJWT, async (req, res) => {
  try {
    let where = 'WHERE d.current_status != $1';
    let params = ['Delivered'];
    if (req.user.role === 'operator') {
      where += ' AND pb.created_by_user_id = $2';
      params.push(req.user.id);
    }
    const query = `
      SELECT 
        pb.customer_name, 
        COUNT(*) AS pending_count, 
        SUM(d.tonnage) AS pending_tonnage
      FROM deliveries d
      LEFT JOIN parent_bookings pb ON d.parent_booking_id = pb.id
      ${where}
      GROUP BY pb.customer_name
      ORDER BY pb.customer_name
    `;
    const result = await pool.query(query, params);
    res.json({ pending: result.rows });
  } catch (err) {
    console.error('Pending summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Loads value/cost summary
app.get('/deliveries/value-summary', authenticateJWT, async (req, res) => {
  try {
    // Assume value/cost is stored in d.value or d.cost; if not, return tonnage as proxy
    let where = '';
    let params = [];
    if (req.user.role === 'operator') {
      where = 'WHERE pb.created_by_user_id = $1';
      params.push(req.user.id);
    }
    const query = `
      SELECT 
        pb.customer_name, 
        SUM(d.tonnage) AS total_tonnage,
        SUM(d.value) AS total_value,
        SUM(d.cost) AS total_cost,
        COUNT(DISTINCT CASE WHEN d.custom_status = 'On Time' THEN d.tracking_id END) AS on_time_count,
        COUNT(DISTINCT CASE WHEN d.custom_status = 'Delayed' THEN d.tracking_id END) AS delayed_count,
        COUNT(DISTINCT CASE WHEN d.custom_status = 'Cancelled' THEN d.tracking_id END) AS cancelled_count
      FROM deliveries d
      LEFT JOIN parent_bookings pb ON d.parent_booking_id = pb.id
      ${where}
      GROUP BY pb.customer_name
      ORDER BY pb.customer_name
    `;
    const result = await pool.query(query, params);
    res.json({ valueSummary: result.rows });
  } catch (err) {
    console.error('Value summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. General analytics for dashboard graphs
app.get('/deliveries/analytics', authenticateJWT, async (req, res) => {
  try {
    let where = '';
    let params = [];
    if (req.user.role === 'operator') {
      where = 'WHERE pb.created_by_user_id = $1';
      params.push(req.user.id);
    }
    // Main analytics query
    const query = `
      SELECT 
        COUNT(*) AS total_deliveries,
        SUM(CASE WHEN d.current_status = 'Delivered' THEN 1 ELSE 0 END) AS completed_deliveries,
        SUM(CASE WHEN d.current_status != 'Delivered' THEN 1 ELSE 0 END) AS pending_deliveries,
        SUM(d.tonnage) AS total_tonnage,
        SUM(d.value) AS total_value,
        SUM(d.cost) AS total_cost,
        COUNT(DISTINCT CASE WHEN d.custom_status = 'On Time' THEN d.tracking_id END) AS on_time_count,
        COUNT(DISTINCT CASE WHEN d.custom_status = 'Delayed' THEN d.tracking_id END) AS delayed_count,
        COUNT(DISTINCT CASE WHEN d.custom_status = 'Cancelled' THEN d.tracking_id END) AS cancelled_count
      FROM deliveries d
      LEFT JOIN parent_bookings pb ON d.parent_booking_id = pb.id
      ${where}
    `;
    const result = await pool.query(query, params);
    // Monthly breakdown for the last 12 months
    const monthlyQuery = `
      SELECT
        TO_CHAR(date_trunc('month', d.created_at), 'Mon YYYY') AS month,
        COUNT(*) AS deliveries
      FROM deliveries d
      LEFT JOIN parent_bookings pb ON d.parent_booking_id = pb.id
      ${where}
      GROUP BY month
      ORDER BY MIN(d.created_at)
      LIMIT 12
    `;
    const monthlyResult = await pool.query(monthlyQuery, params);
    const monthlyLabels = monthlyResult.rows.map(r => r.month);
    const monthlyData = monthlyResult.rows.map(r => parseInt(r.deliveries, 10));
    res.json({ analytics: { ...result.rows[0], monthlyLabels, monthlyData } });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/updateCheckpoint', authenticateJWT, checkQuota('sms'), async (req, res) => {
  console.info(`[INFO][API][POST /updateCheckpoint] Body:`, req.body);
  const { trackingId, checkpoints, currentStatus } = req.body;
  
  // Validate required fields
  if (!trackingId || !checkpoints || !currentStatus) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Ensure operator_id is set from the authenticated user
  const operatorId = req.user.id;
  const updatedCheckpoints = checkpoints.map(c => ({
    ...c,
    operator_id: c.operator_id || operatorId
  }));

  try {
    // Get delivery and its parent booking status
    const deliveryResult = await pool.query(
      'SELECT d.*, pb.status as parent_status FROM deliveries d ' +
      'LEFT JOIN parent_bookings pb ON d.parent_booking_id = pb.id ' +
      'WHERE d.tracking_id = $1',
      [trackingId]
    );
    
    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    const row = deliveryResult.rows[0];

    // Determine if the delivery's completion state is changing
    const isNowCompleted = currentStatus === 'Delivered';
    const wasCompleted = row.is_completed;
    
    // Update the delivery's status and completion date
    const completionDate = isNowCompleted ? (wasCompleted ? row.completion_date : new Date().toISOString()) : null;
    await pool.query(
      `UPDATE deliveries 
       SET checkpoints = $1, 
           current_status = $2,
           is_completed = $3,
           completion_date = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE tracking_id = $5`,
      [JSON.stringify(updatedCheckpoints), currentStatus, isNowCompleted, completionDate, trackingId]
    );

    // If completion status has changed, adjust the parent booking's tonnage
    let tonnageDelta = 0;
    if (isNowCompleted && !wasCompleted) {
      tonnageDelta = row.tonnage; // Subtract tonnage
    } else if (!isNowCompleted && wasCompleted) {
      tonnageDelta = -row.tonnage; // Add tonnage back
    }

    if (tonnageDelta !== 0) {
      await pool.query(
        `UPDATE parent_bookings 
         SET completed_tonnage = completed_tonnage + $1,
             remaining_tonnage = remaining_tonnage - $1
         WHERE id = $2`,
        [tonnageDelta, row.parent_booking_id]
      );
    }

    // Always re-evaluate parent booking status based on its current tonnage
    const parentBookingResult = await pool.query(
        'SELECT status, remaining_tonnage FROM parent_bookings WHERE id = $1',
        [row.parent_booking_id]
      );
    
    if (parentBookingResult.rows.length > 0) {
      const parentBooking = parentBookingResult.rows[0];
      const newParentStatus = parentBooking.remaining_tonnage > 0.001 ? 'Active' : 'Completed';

      if (parentBooking.status !== newParentStatus) {
          await pool.query(
            'UPDATE parent_bookings SET status = $1 WHERE id = $2',
          [newParentStatus, row.parent_booking_id]
          );
      }
    } else {
      console.warn(`[DATA INCONSISTENCY] Parent booking with ID ${row.parent_booking_id} not found for delivery ${trackingId}. Skipping parent status update.`);
    }
    
    // Increment SMS quota usage before sending
    await pool.query(
      'UPDATE subscriptions SET sms_used = sms_used + 1 WHERE id = $1',
      [req.subscription.id]
    );

    // Get the latest checkpoint for SMS notification
    const latestCheckpoint = updatedCheckpoints[updatedCheckpoints.length - 1];

    // Prepare SMS message with enhanced information
    let smsMessage = `Update for ${trackingId}: Now at ${latestCheckpoint.location}. Status: ${currentStatus}.`;
    
    // Add completion information if delivery is completed
    if (isNowCompleted) {
      smsMessage = `Delivery ${trackingId} has been successfully completed and delivered.`;
    }
    
    // Add issue information if there's an issue
    if (latestCheckpoint.hasIssue && !isNowCompleted) {
      smsMessage += ` Note: ${latestCheckpoint.issueDetails}`;
    }

    // Send SMS notification
    const smsRes = await sendSMS(row.phone_number, smsMessage);
    
    // Audit log
    console.info(`[AUDIT][API][POST /updateCheckpoint] Checkpoint updated for ${trackingId} by ${req.user.username} at ${new Date().toISOString()} | Status: ${currentStatus}`);
    
    if (!smsRes.success) {
      return res.status(207).json({
        success: true,
        warning: 'Checkpoint updated, but SMS failed',
        smsError: smsRes.error,
        checkpoints: updatedCheckpoints
      });
    }
    
    res.json({ 
      success: true,
      checkpoints: updatedCheckpoints,
      isCompleted: isNowCompleted,
      completionDate
    });
  } catch (err) {
    console.error('Update checkpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Billing/Subscription
app.get('/billing', authenticateJWT, async (req, res) => {
  // ... existing code ...
});

app.get('/plans', authenticateJWT, async (req, res) => {
  // ... existing code ...
});

// Push Notifications
app.post('/subscribe', authenticateJWT, async (req, res) => {
  const subscription = req.body;
  const userId = req.user.id;

  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Subscription and user ID are required.' });
  }

  try {
    // Store subscription in the database
    await pool.query(
      'INSERT INTO push_subscriptions (user_id, subscription_info) VALUES ($1, $2) ON CONFLICT (user_id, subscription_info) DO NOTHING',
      [userId, JSON.stringify(subscription)]
    );

    res.status(201).json({ success: true, message: 'Subscribed successfully.' });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

app.post('/send-notification', authenticateJWT, async (req, res) => {
  const { userId, message } = req.body;
  
  if (!userId || !message) {
    return res.status(400).json({ error: 'User ID and message are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT subscription_info FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No push subscriptions found for this user.' });
    }

    const notificationPayload = JSON.stringify({
      title: 'Morres Logistics',
      body: message,
      icon: '/logo.jpg',
    });

    const promises = result.rows.map(row =>
      webPush.sendNotification(row.subscription_info, notificationPayload)
    );

    await Promise.all(promises);

    res.status(200).json({ success: true, message: 'Notification sent.' });
  } catch (err) {
    console.error('Failed to send notification:', err);
    // Check for specific error types, e.g., 'gone' for expired subscriptions
    if (err.statusCode === 410) {
      // You might want to remove the expired subscription from the database here
    }
    res.status(500).json({ error: 'Failed to send notification.' });
  }
});

// --- PUSH NOTIFY ENDPOINT ---
app.post('/api/notify', async (req, res) => {
  const { subscription, title, body } = req.body;
  if (!subscription || !title || !body) {
    return res.status(400).json({ error: 'Missing subscription, title, or body.' });
  }
  try {
    await webPush.sendNotification(subscription, JSON.stringify({ title, body }));
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to send push notification:', err);
    res.status(500).json({ error: 'Failed to send push notification.' });
  }
});

// Subscription Management
app.get('/api/subscriptions/me', authenticateJWT, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status IN (\'active\', \'trial\') ORDER BY start_date DESC LIMIT 1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Check if user ever had a subscription
      const historyResult = await pool.query(
        'SELECT COUNT(*) FROM subscriptions WHERE user_id = $1',
        [req.user.id]
      );
      const hasHistory = parseInt(historyResult.rows[0].count, 10) > 0;
      if (hasHistory) {
        return res.status(404).json({ error: 'No active subscription found. Please upgrade your plan.' });
      }
      // Try to atomically insert a trial subscription if none exists
      const { trialSettings } = await import('./config/subscriptions.js');
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + trialSettings.durationDays);
      try {
        await pool.query(
          `INSERT INTO subscriptions (user_id, tier, status, start_date)
           VALUES ($1, $2, 'trial', $3)
           ON CONFLICT (user_id) WHERE status IN ('active', 'trial') DO NOTHING`,
          [req.user.id, trialSettings.tier, now]
        );
        // Audit log
        console.info(`[AUDIT][API][GET /api/subscriptions/me] Attempted auto-create trial for user ${req.user.id} at ${now.toISOString()}`);
      } catch (insertErr) {
        if (insertErr.code !== '23505') {
          // Only ignore unique violation, otherwise throw
          throw insertErr;
        }
      }
      // Always fetch the latest active/trial subscription after insert attempt
      const latestResult = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 AND status IN (\'active\', \'trial\') ORDER BY start_date DESC LIMIT 1',
        [req.user.id]
      );
      if (latestResult.rows.length === 0) {
        return res.status(500).json({ error: 'Failed to create or fetch trial subscription.' });
      }
      const subscription = latestResult.rows[0];
      const { subscriptionTiers } = await import('./config/subscriptions.js');
      const tierDetails = subscriptionTiers[subscription.tier];
      return res.json({ ...subscription, tierDetails });
    }
    
    const subscription = result.rows[0];
    const { subscriptionTiers } = await import('./config/subscriptions.js');
    const tierDetails = subscriptionTiers[subscription.tier];

    res.json({ ...subscription, tierDetails });

  } catch (err) {
    console.error('Get my subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/subscriptions', authenticateJWT, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id as subscription_id, s.user_id, u.username, s.tier, s.status, 
        s.start_date, s.end_date, s.deliveries_used, s.sms_used
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      ORDER BY u.username, s.start_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin get subscriptions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/admin/subscriptions/:userId', authenticateJWT, adminOnly, async (req, res) => {
  const { userId } = req.params;
  const { newTier, newStatus, newEndDate } = req.body;

  if (!newTier && !newStatus && !newEndDate) {
    return res.status(400).json({ error: 'At least one field to update is required (newTier, newStatus, newEndDate).' });
  }

  // Basic validation
  const { subscriptionTiers } = await import('./config/subscriptions.js');
  if (newTier && !subscriptionTiers[newTier]) {
    return res.status(400).json({ error: 'Invalid subscription tier provided.' });
  }
  
  try {
    // This is a simplified update logic for the MVP. A real-world scenario
    // would involve more complex logic like deactivating old subscriptions.
    // Here we just update the most recent one.
    const findSubQuery = `
      SELECT id FROM subscriptions WHERE user_id = $1 ORDER BY start_date DESC LIMIT 1
    `;
    const subResult = await pool.query(findSubQuery, [userId]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'No existing subscription found for this user to update.' });
    }
    const subscriptionId = subResult.rows[0].id;

    // Build the update query dynamically
    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (newTier) {
      fields.push(`tier = $${queryIndex++}`);
      values.push(newTier);
    }
    if (newStatus) {
      fields.push(`status = $${queryIndex++}`);
      values.push(newStatus);
    }
    if (newEndDate) {
      fields.push(`end_date = $${queryIndex++}`);
      values.push(newEndDate);
    }
    
    // Always reset quotas on tier change
    if (newTier) {
      fields.push('deliveries_used = 0', 'sms_used = 0');
    }

    values.push(subscriptionId);
    
    const updateQuery = `
      UPDATE subscriptions SET ${fields.join(', ')} 
      WHERE id = $${queryIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    // Log admin action
    if (req.user && req.user.username) {
      await pool.query(
        'INSERT INTO admin_logs (action, actor, target, details) VALUES ($1, $2, $3, $4)',
        ['update_subscription', req.user.username, userId, JSON.stringify({ newTier, newStatus, newEndDate })]
      );
    }
    
    console.info(`[AUDIT][API][PATCH /api/admin/subscriptions/:userId] Subscription for user ${userId} updated by admin ${req.user.username}. New tier: ${newTier}`);
    res.json({ success: true, subscription: result.rows[0] });

  } catch (err) {
    console.error(`[ERROR][API][PATCH /api/admin/subscriptions/:userId] Admin update subscription error for user ${userId}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/auth', authRouter);

// --- REFRESH ENDPOINT ---
app.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.cookies;
  if (!refresh_token) return res.status(401).json({ error: 'No refresh token' });
  const result = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refresh_token]);
  if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid refresh token' });
  const tokenData = result.rows[0];
  if (new Date(tokenData.expires_at) < new Date()) return res.status(401).json({ error: 'Refresh token expired' });
  // Rotate: delete old, issue new
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
  const newRefreshToken = generateRefreshToken();
  const newExpiry = new Date(Date.now() + 30*24*60*60*1000);
  await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [tokenData.user_id, newRefreshToken, newExpiry]);
  res.cookie('refresh_token', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth/refresh', maxAge: 30*24*60*60*1000 });
  // Issue new access token
  const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [tokenData.user_id]);
  const user = userResult.rows[0];
  const newAccessToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '12h' });
  res.json({ token: newAccessToken });
});
// --- LOGOUT ENDPOINT ---
app.post('/api/auth/logout', async (req, res) => {
  const { refresh_token } = req.cookies;
  if (refresh_token) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  }
  res.json({ success: true });
});

// Public delivery tracking endpoint
app.get('/deliveries/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const result = await pool.query('SELECT * FROM deliveries WHERE tracking_id = $1', [trackingId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Track delivery error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/parent-bookings', parentBookingsRouter);
app.use('/api/admin', adminRouter);

// Get all subscriptions for the current user
app.get('/api/subscriptions/all', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY start_date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get all subscriptions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID || 'your_id',
  process.env.PAYNOW_INTEGRATION_KEY || 'your_key'
);
paynow.resultUrl = process.env.PAYNOW_RESULT_URL || 'https://your-backend-url.com/api/paynow/callback';
paynow.returnUrl = process.env.PAYNOW_RETURN_URL || 'https://your-frontend-url.com/payment-success';

// POST /api/subscriptions - create a new subscription and initiate payment
app.post('/api/subscriptions', authenticateJWT, async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;
    if (!tier || !subscriptionTiers[tier]) {
      return res.status(400).json({ error: 'Invalid or missing subscription tier.' });
    }
    // Check for existing active/trial subscription
    const existing = await pool.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trial', 'pending') ORDER BY start_date DESC LIMIT 1`,
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already have an active or pending subscription.' });
    }
    // Create pending subscription (start_date = now, end_date = null until payment)
    const now = new Date();
    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, tier, status, start_date) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, tier, 'pending', now]
    );
    const subscription = result.rows[0];
    // Initiate Paynow payment
    const paynowClient = new paynow(
      process.env.PAYNOW_INTEGRATION_ID,
      process.env.PAYNOW_INTEGRATION_KEY
    );
    const userEmail = req.user.email || 'info@morres.com';
    const payment = paynowClient.createPayment(
      `Subscription ${tier} for user ${userId}`,
      userEmail
    );
    payment.add(`Morres Logistics Subscription (${tier})`, subscriptionTiers[tier].price);
    const response = await paynowClient.send(payment);
    if (response.success) {
      // Optionally, store poll URL in DB for later verification
      await pool.query(
        'UPDATE subscriptions SET paynow_poll_url = $1 WHERE id = $2',
        [response.pollUrl, subscription.id]
      );
      return res.json({ paynowUrl: response.redirectUrl });
    } else {
      // Clean up failed subscription
      await pool.query('DELETE FROM subscriptions WHERE id = $1', [subscription.id]);
      return res.status(500).json({ error: 'Failed to initiate payment. Please try again.' });
    }
  } catch (err) {
    console.error('Create subscription error:', err);
    return res.status(500).json({ error: 'Failed to create subscription.' });
  }
});

// Paynow callback endpoint
app.post('/api/paynow/callback', async (req, res) => {
  // Paynow will POST payment status here
  const { reference, status, pollurl } = req.body;
  try {
    // Find the subscription by pollurl or reference
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE paynow_poll_url = $1',
      [pollurl]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found for payment.' });
    }
    const subscription = result.rows[0];
    if (status === 'Paid' || status === 'Paid*') {
      await pool.query(
        'UPDATE subscriptions SET status = $1 WHERE id = $2',
        ['active', subscription.id]
      );
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Paynow callback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Notification API Endpoints ---

// 1. Get notifications for current user (or global/system notifications)
app.get('/api/notifications', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetch user-specific and global notifications (user_id IS NULL)
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR user_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Mark notification as read
app.patch('/api/notifications/:id/read', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    // Only allow marking notifications that belong to user or are global
    const result = await pool.query(
      `UPDATE notifications
       SET read = true
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
       RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or not permitted.' });
    }
    res.json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Create a notification (admin/system only)
app.post('/api/notifications', authenticateJWT, adminOnly, async (req, res) => {
  try {
    const { user_id, type = 'info', message, entity_type, entity_id } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, message, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id || null, type, message, entity_type || null, entity_id || null]
    );
    res.status(201).json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Invoice API Endpoints ---

// 1. Get invoice history for current user
app.get('/api/invoices', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json({ invoices: result.rows });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Download invoice (JSON placeholder)
app.get('/api/invoices/:invoiceId/download', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceId } = req.params;
    const result = await pool.query(
      `SELECT * FROM invoices WHERE invoice_id = $1 AND user_id = $2`,
      [invoiceId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    // For now, return JSON; in future, generate PDF/CSV
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.json`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Download invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SCHEDULED REPORTS ENDPOINTS ---

// Helper: Ensure scheduled_reports table exists (migration placeholder)
async function ensureScheduledReportsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id UUID PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      recipients TEXT NOT NULL,
      schedule_type VARCHAR(20) NOT NULL,
      day_of_week VARCHAR(10),
      time VARCHAR(10),
      report_type VARCHAR(20) NOT NULL,
      columns TEXT NOT NULL,
      filters JSONB,
      status VARCHAR(20) DEFAULT 'active',
      last_run TIMESTAMP,
      next_run TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
ensureScheduledReportsTable();

// POST /api/reports/schedule
app.post('/api/reports/schedule', authenticateJWT, async (req, res) => {
  const { recipients, schedule, dayOfWeek, time, reportType, columns, filters } = req.body;
  if (!recipients || !schedule || !dayOfWeek || !time || !reportType || !columns) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO scheduled_reports (id, user_id, recipients, schedule_type, day_of_week, time, report_type, columns, filters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, req.user.id, recipients.join(','), schedule, dayOfWeek, time, reportType, columns.join(','), filters ? JSON.stringify(filters) : null]
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error('Create scheduled report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/schedule
app.get('/api/reports/schedule', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scheduled_reports WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get scheduled reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reports/schedule/:id
app.put('/api/reports/schedule/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { recipients, schedule, dayOfWeek, time, reportType, columns, filters, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE scheduled_reports SET
        recipients = $1,
        schedule_type = $2,
        day_of_week = $3,
        time = $4,
        report_type = $5,
        columns = $6,
        filters = $7,
        status = COALESCE($8, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND user_id = $10
      RETURNING *`,
      [recipients.join(','), schedule, dayOfWeek, time, reportType, columns.join(','), filters ? JSON.stringify(filters) : null, status, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled report not found.' });
    }
    res.json({ success: true, report: result.rows[0] });
  } catch (err) {
    console.error('Update scheduled report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reports/schedule/:id
app.delete('/api/reports/schedule/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM scheduled_reports WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled report not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete scheduled report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Placeholder: Background job to process and send scheduled reports
// (To be implemented: cron/worker that queries scheduled_reports, generates PDF/CSV, and emails to recipients)

// Email transporter (configure via .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Helper: Calculate next run time
function getNextRun(scheduleType, dayOfWeek, time) {
  const now = new Date();
  let next = new Date(now);
  const [hour, minute] = time.split(':').map(Number);
  next.setHours(hour, minute, 0, 0);
  if (scheduleType === 'weekly') {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const targetDay = days.indexOf(dayOfWeek);
    let diff = (targetDay - now.getDay() + 7) % 7;
    if (diff === 0 && now > next) diff = 7;
    next.setDate(now.getDate() + diff);
  } else if (scheduleType === 'monthly') {
    // Next occurrence of this day in the next month
    next.setMonth(now.getMonth() + (now > next ? 1 : 0));
  }
  if (next < now) next.setDate(next.getDate() + 1);
  return next;
}

// Cron job: runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    const result = await pool.query(
      `SELECT * FROM scheduled_reports WHERE status = 'active' AND (next_run IS NULL OR next_run <= $1)`,
      [now]
    );
    for (const report of result.rows) {
      // Fetch deliveries based on report config (MVP: all deliveries for user)
      const deliveriesRes = await pool.query(
        'SELECT * FROM deliveries WHERE created_by_user_id = $1',
        [report.user_id]
      );
      let deliveries = deliveriesRes.rows;
      // Apply filters if present (MVP: skip for now)
      // Select columns
      const columns = report.columns.split(',');
      const data = deliveries.map(d => {
        const row = {};
        columns.forEach(col => { row[col] = d[col]; });
        return row;
      });
      // Generate CSV
      const csv = new CsvParser({ fields: columns }).parse(data);
      // Email
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@morreslogistics.com',
        to: report.recipients,
        subject: 'Scheduled Morres Logistics Report',
        text: 'See attached CSV report.',
        attachments: [
          { filename: 'report.csv', content: csv }
        ]
      };
      try {
        await transporter.sendMail(mailOptions);
        // Update last_run and next_run
        const nextRun = getNextRun(report.schedule_type, report.day_of_week, report.time);
        await pool.query(
          'UPDATE scheduled_reports SET last_run = $1, next_run = $2 WHERE id = $3',
          [now, nextRun, report.id]
        );
        console.info(`[SCHEDULED REPORT] Sent to ${report.recipients} at ${now}`);
      } catch (err) {
        console.error(`[SCHEDULED REPORT ERROR] Email failed for report ${report.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[SCHEDULED REPORT CRON ERROR]', err);
  }
});

// --- PUBLIC ONE-TIME DELIVERY ENDPOINT ---

const publicDeliveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

app.post('/api/public/send-delivery', publicDeliveryLimiter, async (req, res) => {
  const { customer_name, phone_number, loading_point, destination, tonnage, container_count } = req.body;
  // Basic validation
  if (!customer_name || !phone_number || !loading_point || !destination || !tonnage || !container_count) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!validateZimPhone(phone_number)) {
    return res.status(400).json({ error: 'Invalid Zimbabwean phone number.' });
  }
  // Create Paynow payment for $1.00
  const paynowPayment = paynow.createPayment(
    `One-Time Delivery for ${customer_name}`,
    phone_number + '@public.morres.com'
  );
  paynowPayment.add('One-Time Delivery', 1.00);
  try {
    const response = await paynow.send(paynowPayment);
    if (response.success) {
      // Store pollUrl and delivery details in a temp table for callback
      await pool.query(
        'INSERT INTO one_time_deliveries (paynow_poll_url, customer_name, phone_number, loading_point, destination, tonnage, container_count, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [response.pollUrl, customer_name, phone_number, loading_point, destination, tonnage, container_count, 'pending']
      );
      return res.json({ paynowUrl: response.redirectUrl });
    } else {
      return res.status(500).json({ error: 'Failed to initiate payment with Paynow.' });
    }
  } catch (err) {
    console.error('One-Time Delivery Paynow error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- PAYNOW CALLBACK LOGIC ---
app.post('/api/paynow/one-time-callback', async (req, res) => {
  const { pollUrl, paymentStatus } = req.body;
  if (!pollUrl || paymentStatus !== 'Paid') return res.status(400).json({ error: 'Invalid callback.' });
  try {
    // Find the pending one-time delivery
    const result = await pool.query('SELECT * FROM one_time_deliveries WHERE paynow_poll_url = $1 AND status = $2', [pollUrl, 'pending']);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No pending delivery found.' });
    const delivery = result.rows[0];
    // Mark as paid
    await pool.query('UPDATE one_time_deliveries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['paid', delivery.id]);
    // Create a delivery record (minimal fields)
    await pool.query(
      `INSERT INTO deliveries (customer_name, phone_number, loading_point, destination, tonnage, container_count, current_status, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,'Pending',NULL)`,
      [delivery.customer_name, delivery.phone_number, delivery.loading_point, delivery.destination, delivery.tonnage, delivery.container_count]
    );
    // Send SMS (pseudo, replace with actual SMS logic)
    // await sendSMS(delivery.phone_number, 'Your one-time delivery has been created!');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('One-time Paynow callback error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/paynow/addon-callback', async (req, res) => {
  const { pollUrl, paymentStatus } = req.body;
  if (!pollUrl || paymentStatus !== 'Paid') return res.status(400).json({ error: 'Invalid callback.' });
  try {
    // Find the pending add-on purchase
    const result = await pool.query('SELECT * FROM addon_purchases WHERE paynow_poll_url = $1 AND status = $2', [pollUrl, 'pending']);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No pending add-on found.' });
    const addon = result.rows[0];
    // Mark as paid
    await pool.query('UPDATE addon_purchases SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['paid', addon.id]);
    // Credit the user's subscription
    if (addon.type === 'deliveries') {
      await pool.query('UPDATE subscriptions SET deliveries_used = deliveries_used - $1 WHERE user_id = $2 AND status = $3', [addon.quantity, addon.user_id, 'active']);
    } else if (addon.type === 'sms') {
      await pool.query('UPDATE subscriptions SET sms_used = sms_used - $1 WHERE user_id = $2 AND status = $3', [addon.quantity, addon.user_id, 'active']);
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Add-on Paynow callback error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- ADD-ON PURCHASE ENDPOINTS ---
app.post('/api/addons/purchase-deliveries', authenticateJWT, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity required.' });
  const price = 0.25 * quantity;
  const paynowPayment = paynow.createPayment(
    `Extra Deliveries for ${req.user.username}`,
    req.user.email || 'test@example.com'
  );
  paynowPayment.add('Extra Deliveries', price);
  try {
    const response = await paynow.send(paynowPayment);
    if (response.success) {
      await pool.query(
        'INSERT INTO addon_purchases (user_id, type, quantity, paynow_poll_url, status) VALUES ($1,$2,$3,$4,$5)',
        [req.user.id, 'deliveries', quantity, response.pollUrl, 'pending']
      );
      return res.json({ paynowUrl: response.redirectUrl });
    } else {
      return res.status(500).json({ error: 'Failed to initiate payment with Paynow.' });
    }
  } catch (err) {
    console.error('Addon purchase error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/addons/purchase-sms', authenticateJWT, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity required.' });
  const price = 2.00 * (quantity / 100);
  const paynowPayment = paynow.createPayment(
    `SMS Top-up for ${req.user.username}`,
    req.user.email || 'test@example.com'
  );
  paynowPayment.add('SMS Top-up', price);
  try {
    const response = await paynow.send(paynowPayment);
    if (response.success) {
      await pool.query(
        'INSERT INTO addon_purchases (user_id, type, quantity, paynow_poll_url, status) VALUES ($1,$2,$3,$4,$5)',
        [req.user.id, 'sms', quantity, response.pollUrl, 'pending']
      );
      return res.json({ paynowUrl: response.redirectUrl });
    } else {
      return res.status(500).json({ error: 'Failed to initiate payment with Paynow.' });
    }
  } catch (err) {
    console.error('Addon purchase error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local API running on port ${PORT}`);
});

// Health check endpoint for online/offline detection
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/operators', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username FROM users WHERE role = $1 ORDER BY id',
      ['operator']
    );
    res.json({ operators: result.rows });
  } catch (err) {
    console.error('Get operators error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});