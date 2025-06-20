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
app.post('/deliveries', authenticateSession, async (req, res) => {
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
            driver_details
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
            JSON.stringify(driver_details)
          ]
        );

        // 4. Send SMS to customer
        const smsMessage = `Welcome! Your delivery is created. Tracking ID: ${tracking_id}. Status: ${current_status}`;
        const smsRes = await sendSMS(phone_number, smsMessage);

        // 5. Audit log
        console.log(`[AUDIT] Delivery created by ${req.user.username} at ${new Date().toISOString()} | TrackingID: ${tracking_id}`);

        if (!smsRes.success) {
          return res.status(207).json({
            success: true,
            warning: 'Delivery created, but SMS failed',
            trackingId: tracking_id,
            delivery: result.rows[0],
            smsError: smsRes.error
          });
        }

        res.json({ 
          success: true, 
          trackingId: tracking_id,
          delivery: result.rows[0]
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

app.post('/updateCheckpoint', authenticateSession, async (req, res) => {
  console.log('UpdateCheckpoint body:', req.body);
  const { trackingId, checkpoints, currentStatus } = req.body;
  
  // Validate required fields
  if (!trackingId || !checkpoints || !currentStatus) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

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
      [JSON.stringify(checkpoints), currentStatus, isNowCompleted, completionDate, trackingId]
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
        [tonnageDelta, tonnageDelta, row.parent_booking_id]
      );
    }
    
    // Always re-evaluate parent booking status based on its current tonnage
    const parentBookingResult = await pool.query(
        'SELECT status, remaining_tonnage FROM parent_bookings WHERE id = $1',
        [row.parent_booking_id]
    );
    const parentBooking = parentBookingResult.rows[0];
    const newParentStatus = parentBooking.remaining_tonnage > 0.001 ? 'Active' : 'Completed';

    if (parentBooking.status !== newParentStatus) {
      await pool.query(
        'UPDATE parent_bookings SET status = $1 WHERE id = $2',
        [newParentStatus, row.parent_booking_id]
      );
    }
    
    // Get the latest checkpoint for SMS notification
    const latestCheckpoint = checkpoints[checkpoints.length - 1];

    // Prepare SMS message with enhanced information
    let smsMessage = `Update: Your delivery (${trackingId}) is now at ${latestCheckpoint.location}. Status: ${currentStatus}.`;
    
    // Add completion information if delivery is completed
    if (isNowCompleted) {
      smsMessage += ' Delivery completed successfully!';
    }
    
    // Add issue information if there's an issue
    if (latestCheckpoint.hasIssue) {
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
        checkpoints: checkpoints
      });
    }
    
    res.json({ 
      success: true,
      checkpoints: checkpoints,
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
    const result = await pool.query(`
      SELECT 
        d.*,
        pb.mineral_type,
        pb.mineral_grade
      FROM 
        deliveries d
      LEFT JOIN 
        parent_bookings pb ON d.parent_booking_id = pb.id
      ORDER BY 
        d.created_at DESC
    `);
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

// Parent Booking Routes
app.post('/parent-bookings', authenticateSession, async (req, res) => {
  // Handle both camelCase and snake_case field names
  const { 
    customerName, customer_name,
    phoneNumber, phone_number,
    totalTonnage, total_tonnage,
    mineral_type,
    mineral_grade,
    loadingPoint, loading_point,
    destination,
    deadline,
    notes,
    moisture_content,
    particle_size,
    requires_analysis,
    special_handling_notes,
    environmental_concerns
  } = req.body;

  // Use the first non-null value for each field
  const data = {
    customerName: customerName || customer_name,
    phoneNumber: phoneNumber || phone_number,
    totalTonnage: totalTonnage || total_tonnage,
    mineral_type,
    mineral_grade,
    loadingPoint: loadingPoint || loading_point,
    destination,
    deadline,
    notes,
    moisture_content,
    particle_size,
    requires_analysis,
    special_handling_notes,
    environmental_concerns
  };

  try {
    console.log('Received parent booking request:', data);

    // Generate booking code first
    const bookingCode = generateBookingCode();
    console.log('Generated booking code:', bookingCode);

    // Validate required fields
    if (!data.customerName || !data.phoneNumber || !data.totalTonnage || !data.mineral_type || !data.loadingPoint || !data.destination || !data.deadline) {
      console.log('Missing required fields:', {
        customerName: !data.customerName,
        phoneNumber: !data.phoneNumber,
        totalTonnage: !data.totalTonnage,
        mineral_type: !data.mineral_type,
        loadingPoint: !data.loadingPoint,
        destination: !data.destination,
        deadline: !data.deadline
      });
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Validate phone number
    const isValidPhone = validateZimPhone(data.phoneNumber);
    console.log('Phone validation result:', { phoneNumber: data.phoneNumber, isValid: isValidPhone });
    if (!isValidPhone) {
      return res.status(400).json({ error: 'Invalid Zimbabwean phone number.' });
    }

    // Validate tonnage
    if (data.totalTonnage <= 0) {
      console.log('Invalid tonnage:', data.totalTonnage);
      return res.status(400).json({ error: 'Total tonnage must be greater than 0.' });
    }

    // Validate deadline
    const deadlineDate = new Date(data.deadline);
    const now = new Date();
    console.log('Deadline validation:', { deadline: data.deadline, deadlineDate, now, isValid: deadlineDate > now });
    if (deadlineDate <= now) {
      return res.status(400).json({ error: 'Deadline must be in the future.' });
    }

    // Validate moisture content if provided
    if (data.moisture_content !== undefined && (data.moisture_content < 0 || data.moisture_content > 100)) {
      console.log('Invalid moisture content:', data.moisture_content);
      return res.status(400).json({ error: 'Moisture content must be between 0 and 100%.' });
    }

    // Validate mineral type
    const validMineralTypes = ['Coal', 'Iron Ore', 'Copper Ore', 'Gold Ore', 'Bauxite', 'Limestone', 'Phosphate', 'Manganese', 'Other'];
    console.log('Mineral type validation:', { mineral_type: data.mineral_type, isValid: validMineralTypes.includes(data.mineral_type) });
    if (!validMineralTypes.includes(data.mineral_type)) {
      return res.status(400).json({ error: 'Invalid mineral type.' });
    }

    // Validate mineral grade if provided
    const validGrades = ['Premium', 'Standard', 'Low Grade', 'Mixed', 'Ungraded'];
    if (data.mineral_grade && !validGrades.includes(data.mineral_grade)) {
      console.log('Invalid mineral grade:', data.mineral_grade);
      return res.status(400).json({ error: 'Invalid mineral grade.' });
    }

    const result = await pool.query(
      `INSERT INTO parent_bookings (
        customer_name, 
        phone_number, 
        total_tonnage, 
        mineral_type, 
        mineral_grade, 
        loading_point, 
        destination, 
        deadline, 
        booking_code, 
        notes,
        moisture_content,
        particle_size,
        requires_analysis,
        special_handling_notes,
        environmental_concerns,
        remaining_tonnage,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *`,
      [
        data.customerName, 
        data.phoneNumber, 
        data.totalTonnage, 
        data.mineral_type, 
        data.mineral_grade || 'Ungraded', 
        data.loadingPoint,
        data.destination, 
        data.deadline, 
        bookingCode, 
        data.notes || '',
        data.moisture_content,
        data.particle_size,
        data.requires_analysis || false,
        data.special_handling_notes,
        data.environmental_concerns,
        data.totalTonnage, // Initially, remaining_tonnage equals total_tonnage
        'Active'  // Default status
      ]
    );

    // Send SMS notification
    const smsMessage = `Welcome! Your booking is created. Booking Code: ${bookingCode}. Total Tonnage: ${data.totalTonnage}`;
    const smsRes = await sendSMS(data.phoneNumber, smsMessage);

    // Audit log
    console.log(`[AUDIT] Parent booking created by ${req.user.username} at ${new Date().toISOString()} | BookingCode: ${bookingCode}`);

    if (!smsRes.success) {
      return res.status(207).json({
        success: true,
        warning: 'Booking created, but SMS failed',
        booking: result.rows[0],
        smsError: smsRes.error
      });
    }

    res.json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error('Create parent booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/parent-bookings', authenticateSession, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM booking_progress ORDER BY deadline ASC');
    res.json(result.rows);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local API running on port ${PORT}`);
}); 