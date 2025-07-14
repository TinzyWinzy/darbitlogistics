import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// GET /parent-bookings?search=&progressFilter=&progressSort=&progressSortOrder=&page=&pageSize=
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      progressFilter = 'all',
      progressSort = 'deadline',
      progressSortOrder = 'asc',
      page = 1,
      pageSize = 20
    } = req.query;
    const limit = parseInt(pageSize, 10) || 20;
    const offset = ((parseInt(page, 10) || 1) - 1) * limit;

    // Build WHERE clause for search and filter
    let whereClauses = [];
    let values = [];
    let idx = 1;
    // Per-user segmentation: only show own bookings for non-admins
    if (req.user && req.user.role !== 'admin') {
      whereClauses.push(`created_by_user_id = $${idx}`);
      values.push(req.user.id);
      idx++;
    }
    if (search) {
      whereClauses.push(`(
        LOWER(customer_name) LIKE $${idx} OR
        LOWER(booking_code) LIKE $${idx} OR
        LOWER(destination) LIKE $${idx} OR
        LOWER(loading_point) LIKE $${idx}
      )`);
      values.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (progressFilter === 'completed') {
      whereClauses.push(`completion_percentage = 100`);
    } else if (progressFilter === 'in-progress') {
      whereClauses.push(`completion_percentage > 0 AND completion_percentage < 100`);
    } else if (progressFilter === 'not-started') {
      whereClauses.push(`completion_percentage = 0`);
    } else if (progressFilter === 'overdue') {
      whereClauses.push(`deadline < NOW() AND completion_percentage < 100`);
    }
    const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Sorting
    let sortField = 'deadline';
    if (progressSort === 'progress') sortField = 'completion_percentage';
    else if (progressSort === 'tonnage') sortField = 'total_tonnage';
    else if (progressSort === 'customer') sortField = 'customer_name';
    const sortOrder = progressSortOrder === 'desc' ? 'DESC' : 'ASC';

    // Total count
    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM parent_bookings ${where}`,
      values
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    // Main query
    const bookingsResult = await pool.query(
      `SELECT * FROM parent_bookings ${where} ORDER BY ${sortField} ${sortOrder} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );
    const parentBookings = bookingsResult.rows;

    // Fetch deliveries for these bookings
    const bookingIds = parentBookings.map(b => b.id);
    let deliveries = [];
    if (bookingIds.length > 0) {
      const deliveryResult = await pool.query(
        `SELECT * FROM deliveries WHERE parent_booking_id = ANY($1)`,
        [bookingIds]
      );
      deliveries = deliveryResult.rows;
    }

    // Attach deliveries to each booking (in snake_case)
    const bookingsWithDeliveries = parentBookings.map(booking => ({
      ...booking,
      deliveries: deliveries.filter(d => String(d.parent_booking_id) === String(booking.id))
    }));

    // DEBUG: Log the first booking with deliveries
    if (bookingsWithDeliveries.length > 0) {
      console.info(`[INFO][API][GET /parent-bookings] First booking with deliveries:`, bookingsWithDeliveries[0]);
    } else {
      console.info(`[INFO][API][GET /parent-bookings] No bookings found for this query.`);
    }

    res.json({ parentBookings: bookingsWithDeliveries, total });
  } catch (err) {
    console.error('Error in GET /parent-bookings:', err);
    res.status(500).json({ error: 'Failed to fetch parent bookings' });
  }
});

export default router; 