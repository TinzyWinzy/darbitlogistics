import express from 'express';
import pool from '../config/database.js';
import { authenticateJWT } from '../middleware/auth.js';
import { createUser, deleteUser } from '../controllers/auth.js';

const router = express.Router();

// Middleware to check admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/users - list all users
router.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/logs - return recent system logs (real logs from DB)
router.get('/logs', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin logs:', err);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
});

// GET /api/admin/subscriptions - list all subscriptions
router.get('/subscriptions', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, u.username FROM subscriptions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC');
    // Optionally, add tierDetails from config
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// PATCH /api/admin/subscriptions/:id - update a subscription (tier, status)
router.patch('/subscriptions/:id', authenticateJWT, requireAdmin, async (req, res) => {
  const { tier, status } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE subscriptions SET tier = COALESCE($1, tier), status = COALESCE($2, status), updated_at = NOW() WHERE id = $3 RETURNING *',
      [tier, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// POST /api/admin/users - create user
router.post('/users', authenticateJWT, requireAdmin, createUser);

// DELETE /api/admin/users/:id - delete user
router.delete('/users/:id', authenticateJWT, requireAdmin, deleteUser);

export default router; 