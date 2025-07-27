// Fresh Vercel Serverless Function for DarLogistics
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import your existing routes
import authRouter from '../routes/auth.js';
import parentBookingsRouter from '../routes/parent-bookings.js';
import adminRouter from '../routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for Vercel
app.use(cors({
  origin: [
    'https://darlog-logistics.vercel.app',
    'https://darbitlogistics.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/parent-bookings', parentBookingsRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export for Vercel
export default app; 