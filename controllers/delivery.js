import pool from '../config/database.js';
// Note: The helper functions will be moved to a utils directory in a future step.
// For now, we are just moving the controller logic.
// We will need to create utils/sms.js and utils/helpers.js

// Placeholder functions until helpers are refactored
export async function sendSMS(to, message) { 
  console.log(`Placeholder SMS to ${to}: ${message}`); 
  return { success: true }; 
}
export function validateZimPhone(phone) { return true; }
export function generateTrackingId() { return 'TEMP' + Date.now(); }
export function generateBookingReference() { return 'REF' + Date.now(); }


// Improved delivery creation route
export async function createDelivery(req, res) {
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
            tracking_id, customer_name, phone_number, current_status, parent_booking_id,
            tonnage, container_count, vehicle_type, vehicle_capacity, loading_point,
            destination, booking_reference, checkpoints, driver_details, created_by_user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *`,
          [
            tracking_id, customer_name, phone_number, current_status, parent_booking_id,
            tonnage, container_count, vehicle_type, vehicle_capacity,
            loading_point || booking.loading_point, destination || booking.destination,
            booking_reference, JSON.stringify(checkpoints), JSON.stringify(driver_details),
            req.user.id
          ]
        );

        const newDelivery = result.rows[0];

        await pool.query(
          'UPDATE subscriptions SET deliveries_used = deliveries_used + 1 WHERE id = $1',
          [req.subscription.id]
        );
        
        const trackingBaseUrl = process.env.FRONTEND_URL || 'https://morres-logistics.vercel.app';
        const smsMessage = `Hi ${customer_name}, your delivery with tracking ID ${tracking_id} has been dispatched. Track its progress here: ${trackingBaseUrl}/track-delivery?id=${tracking_id}`