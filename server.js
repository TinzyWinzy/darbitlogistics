// Minimal Express + PostgreSQL backend for Morres Logistics MVP (ES Module version)
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import twilio from 'twilio'; // Import Twilio
import AfricasTalking from 'africastalking'; // Import Africa's Talking
import webPush from 'web-push'; // Import web-push
import bcrypt from 'bcrypt';
import pool from './config/database.js';

dotenv.config();

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
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));

// Ensure only the correct preflight handler is present
app.options('/{*any}', cors(corsOptions));

// Initialize Africa's Talking
let atSMS;
const atApiKey = process.env.AT_API_KEY;
const atEnv = process.env.AT_ENV || 'production';
const atUsername = atEnv === 'sandbox' ? 'sandbox' : process.env.AT_USERNAME;

if (atUsername && atApiKey) {
  const africasTalking = AfricasTalking({
    username: atUsername,
    apiKey: atApiKey,
  });
  atSMS = africasTalking.SMS;
  console.log(`Africa's Talking initialized in ${atEnv} mode.`);
  console.log(`[DEBUG] AT Username Loaded: ${atUsername}`);
} else {
  console.warn("Africa's Talking credentials not set. SMS fallback will not work.");
}

// Helper: Send SMS with Twilio and Africa's Talking fallback
async function sendSMS(to, message) {
  // Standardize the 'to' number to E.164 format for both providers
  let formattedTo = to.replace(/\D/g, ''); // Remove non-digits
  if (formattedTo.startsWith('0')) {
    formattedTo = '263' + formattedTo.substring(1);
  }
  if (!formattedTo.startsWith('+')) {
    formattedTo = `+${formattedTo}`;
  }
  
  // 1. Try Twilio first
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    const client = twilio(accountSid, authToken);
    try {
      const response = await client.messages.create({
        body: message,
        from: fromNumber,
        to: formattedTo,
      });
      console.log('Twilio SMS sent successfully. SID:', response.sid);
      return { success: true, provider: 'twilio', data: response };
    } catch (err) {
      console.error('--- Twilio SMS Error ---');
      console.error('Timestamp:', new Date().toISOString());
      console.error('Full Error Object:', err);
      if (err.code === 'EAI_AGAIN') {
        console.error('[VERBOSE ANALYSIS] The error code EAI_AGAIN suggests a DNS lookup failure. This means the server could not resolve api.twilio.com. This is typically a network connectivity issue on the server itself, not a problem with the Twilio credentials or the code logic. Check the server\'s internet connection and DNS settings.');
      } else if (err.status === 401) {
        console.error('[VERBOSE ANALYSIS] Received a 401 Unauthorized error. This indicates that the TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is incorrect.');
      }
      console.error('--------------------------');
      // Don't return yet, proceed to fallback
    }
  } else {
    console.warn('Twilio environment variables are not fully set.');
  }

  // 2. Fallback to Africa's Talking
  if (atSMS) {
    try {
      // The number is already formatted as international E.164
      const response = await atSMS.send({
        to: [formattedTo],
        message: message,
        from: process.env.AT_SENDER_ID // Optional: Your Sender ID
      });
      console.log("Africa's Talking SMS sent successfully:", response);
      return { success: true, provider: 'africastalking', data: response };
    } catch (err) {
      console.error("--- Africa's Talking SMS Error ---");
      console.error('Timestamp:', new Date().toISOString());
      console.error('Full Error Object:', err);
      if (typeof err.message === 'string' && err.message.includes('401')) {
          console.error('[VERBOSE ANALYSIS] The error message contains "401". This points to an authentication issue. Please verify your AT_USERNAME and AT_API_KEY.');
      }
      console.error('------------------------------------');
    }
  }
  
  // 3. If both fail
  console.error('Both Twilio and Africa\'s Talking failed to send SMS.');
  return { success: false, error: "All SMS providers failed." };
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
      `SELECT u.id, u.username, u.role
       FROM sessions s
       JOIN users u ON s.username = u.username
       WHERE s.session_id = $1 AND s.expires_at > NOW()`,
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      console.log('Invalid or expired session');
      res.clearCookie('session_id', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    req.user = result.rows[0]; // { id, username, role }
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

// Updated login endpoint with proper cookie settings
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12); // 12 hours
    
    await pool.query(
      'INSERT INTO sessions (session_id, username, expires_at) VALUES ($1, $2, $3)',
      [sessionId, user.username, expiresAt]
    );
    
    // Sanitize the user object to send to the client
    const userForClient = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'none', expires: expiresAt });
    res.json({ success: true, user: userForClient });
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

// Improved delivery creation route
app.post('/deliveries', authenticateSession, checkQuota('delivery'), async (req, res) => {
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
    driver_details = {} 
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
            created_by_user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
            req.user.id
          ]
        );

        const newDelivery = result.rows[0];

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
        console.log(`[AUDIT] Delivery created by ${req.user.username} at ${new Date().toISOString()} | TrackingID: ${tracking_id}`);

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

app.post('/updateCheckpoint', authenticateSession, checkQuota('sms'), async (req, res) => {
  console.log('UpdateCheckpoint body:', req.body);
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
    console.log(`[AUDIT] Checkpoint updated for ${trackingId} by ${req.user.username} at ${new Date().toISOString()} | Status: ${currentStatus}`);
    
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

app.get('/deliveries', authenticateSession, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
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

    if (req.user.role === 'operator') {
      baseQuery += ' WHERE pb.created_by_user_id = $1';
      countQuery += ' WHERE pb.created_by_user_id = $1';
      params.push(req.user.id);
      countParams.push(req.user.id);
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

app.get('/me', authenticateSession, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Parent Booking Routes
app.post('/parent-bookings', authenticateSession, async (req, res) => {
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
    environmental_concerns
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
    
    const result = await pool.query(
      `INSERT INTO parent_bookings (
        customer_name, phone_number, total_tonnage, mineral_type, mineral_grade, 
        loading_point, destination, deadline, booking_code, notes,
        moisture_content, particle_size, requires_analysis,
        special_handling_notes, environmental_concerns,
        remaining_tonnage, status, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
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
        req.user.id
      ]
    );

    const newBooking = result.rows[0];

    // Send SMS notification
    const smsMessage = `Your booking is confirmed. Booking Code: ${bookingCode}. Total Tonnage: ${total_tonnage}. We will notify you as deliveries are dispatched.`;
    const smsRes = await sendSMS(phone_number, smsMessage);

    // Audit log
    console.log(`[AUDIT] Parent booking created by ${req.user.username} at ${new Date().toISOString()} | BookingCode: ${bookingCode}`);

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

app.get('/parent-bookings', authenticateSession, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    let baseQuery = `
      SELECT pb.*, bp.completion_percentage, bp.completed_tonnage, bp.total_deliveries
      FROM parent_bookings pb
      LEFT JOIN booking_progress bp ON pb.id = bp.parent_booking_id
    `;
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM parent_bookings pb
    `;
    const params = [];
    const countParams = [];

    if (req.user.username === 'hanzo' || req.user.role === 'admin') {
      // No additional WHERE clause, return all
    } else if (req.user.role === 'operator') {
      baseQuery += ' WHERE pb.created_by_user_id = $1';
      countQuery += ' WHERE pb.created_by_user_id = $1';
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    baseQuery += ' ORDER BY pb.deadline ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(baseQuery, params),
      pool.query(countQuery, countParams)
    ]);
    const total = parseInt(countResult.rows[0].total, 10);
    res.json({ total, parentBookings: result.rows });
  } catch (err) {
    console.error('Get parent bookings error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/parent-bookings/:id', authenticateSession, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM booking_progress WHERE parent_booking_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent booking not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get parent booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/parent-bookings/:id/deliveries', authenticateSession, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM deliveries WHERE parent_booking_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get parent booking deliveries error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/parent-bookings/:id/status', authenticateSession, async (req, res) => {
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

    console.log(`[AUDIT] Parent booking ${id} status updated to ${status} by ${req.user.username}`);
    res.json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error(`Update parent booking status error for id ${id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Admin routes for user management
app.get('/admin/users', authenticateSession, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/admin/users', authenticateSession, adminOnly, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  if (role !== 'operator' && role !== 'admin' && role !== 'viewer') {
    return res.status(400).json({ error: 'Invalid role. Must be "operator", "viewer", or "admin".' });
  }
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user
    const userResult = await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, hashedPassword, role]
    );
    
    const newUser = userResult.rows[0];

    // Automatically create a trial subscription for the new user
    const { trialSettings } = await import('./config/subscriptions.js');
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialSettings.durationDays);

    await client.query(
      `INSERT INTO subscriptions (user_id, tier, status, end_date)
       VALUES ($1, $2, 'trial', $3)`,
      [newUser.id, trialSettings.tier, trialEndDate]
    );

    await client.query('COMMIT');

    console.log(`[AUDIT] User ${username} created by admin ${req.user.username}`);
    console.log(`[SUBSCRIPTION] Trial subscription created for user ${username}. Expires on ${trialEndDate.toISOString()}`);

    res.status(201).json(newUser);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Admin create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.delete('/admin/users/:id', authenticateSession, adminOnly, async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(id, 10) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING username', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[AUDIT] User ${result.rows[0].username} deleted by admin ${req.user.username}`);
    res.json({ success: true, message: `User ${result.rows[0].username} deleted.` });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to provide the VAPID public key to the client
app.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to push notifications
app.post('/subscribe', authenticateSession, async (req, res) => {
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

// Send a test notification (placeholder)
app.post('/send-notification', authenticateSession, async (req, res) => {
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
        icon: '/pwa-192x192.png',
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

// ==> Subscription Management Endpoints <==

// Get current user's subscription details
app.get('/api/subscriptions/me', authenticateSession, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY start_date DESC LIMIT 1',
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
      // Check for existing active/trial subscription (should be none, but double-check for safety)
      const activeTrialResult = await pool.query(
        "SELECT * FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trial')",
        [req.user.id]
      );
      if (activeTrialResult.rows.length === 0) {
        // Atomic insert for trial subscription
        const { trialSettings } = await import('./config/subscriptions.js');
        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + trialSettings.durationDays);
        await pool.query(
          `INSERT INTO subscriptions (user_id, tier, status, start_date, end_date)
           VALUES ($1, $2, 'trial', $3, $4)`,
          [req.user.id, trialSettings.tier, now, trialEndDate]
        );
        // Audit log
        console.log(`[SUBSCRIPTION] Auto-created trial for user ${req.user.id} at ${now.toISOString()}`);
      }
      // Always fetch the latest subscription after insert
      const latestResult = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY start_date DESC LIMIT 1',
        [req.user.id]
      );
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

// Get all user subscriptions (Admin only)
app.get('/api/admin/subscriptions', authenticateSession, adminOnly, async (req, res) => {
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

// Manually update a user's subscription tier (Admin only)
app.patch('/api/admin/subscriptions/:userId', authenticateSession, adminOnly, async (req, res) => {
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
    
    console.log(`[AUDIT] Subscription for user ${userId} updated by admin ${req.user.username}. New tier: ${newTier}`);
    res.json({ success: true, subscription: result.rows[0] });

  } catch (err) {
    console.error(`Admin update subscription error for user ${userId}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local API running on port ${PORT}`);
});