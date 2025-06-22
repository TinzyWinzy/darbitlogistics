import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/database.js';

export async function loginUser(req, res) {
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
}

export async function logoutUser(req, res) {
  const sessionId = req.cookies.session_id;
  try {
    await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
    res.clearCookie('session_id');
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getMe(req, res) {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
} 