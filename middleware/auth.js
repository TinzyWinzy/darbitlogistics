import pool from '../config/database.js';

// Session middleware with updated error handling
export async function authenticateSession(req, res, next) {
  console.log('--- [AUTH DEBUG] In authenticateSession middleware ---');
  const sessionId = req.cookies.session_id;
  
  if (!sessionId) {
    console.log('[AUTH DEBUG] No session cookie found');
    return res.status(401).json({ error: 'Missing session cookie' });
  }
  
  console.log('[AUTH DEBUG] Found session ID:', sessionId);
  
  try {
    console.log('[AUTH DEBUG] Querying database for session...');
    const result = await pool.query(
      `SELECT u.id, u.username, u.role
       FROM sessions s
       JOIN users u ON s.username = u.username
       WHERE s.session_id = $1 AND s.expires_at > NOW()`,
      [sessionId]
    );
    console.log('[AUTH DEBUG] DB query successful. Rows found:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('[AUTH DEBUG] Invalid or expired session');
      res.clearCookie('session_id', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    req.user = result.rows[0]; // { id, username, role }
    console.log('[AUTH DEBUG] Session valid. User set:', req.user);
    next();
  } catch (err) {
    console.error('[AUTH DEBUG] Session auth error:', err);
    // Send more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
}

// Middleware to restrict access to admins
export function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admins only' });
  }
} 