import express from 'express';
import { loginUser, logoutUser, getMe, refreshToken } from '../controllers/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', getMe);
router.post('/refresh', refreshToken);

export default router; 