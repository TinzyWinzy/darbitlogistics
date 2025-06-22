import express from 'express';
import { loginUser, logoutUser, getMe } from '../controllers/auth.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', authenticateSession, logoutUser);
router.get('/me', authenticateSession, getMe);

export default router; 