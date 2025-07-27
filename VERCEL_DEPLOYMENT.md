# Vercel Backend Deployment Guide

## Overview
Your DarLogistics app now has a complete backend setup for Vercel deployment. The backend includes:
- Authentication system
- Database integration (PostgreSQL)
- SMS functionality
- Payment processing
- Push notifications
- Rate limiting
- CORS handling

## Environment Variables Setup

You need to set these environment variables in your Vercel dashboard:

### Database Configuration
```
DATABASE_URL=your_postgresql_connection_string
```

### Authentication
```
JWT_SECRET=your_jwt_secret_key
```

### SMS Configuration (TextBee)
```
TEXTBEE_API_KEY=your_textbee_api_key
TEXTBEE_DEVICE_ID=your_textbee_device_id
```

### Push Notifications
```
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Payment Processing (Paynow)
```
PAYNOW_INTEGRATION_ID=your_paynow_integration_id
PAYNOW_INTEGRATION_KEY=your_paynow_integration_key
```

### Email Configuration
```
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

### Other Configuration
```
NODE_ENV=production
PORT=3000
```

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your app**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project
   - Go to Settings > Environment Variables
   - Add all the environment variables listed above

5. **Redeploy after setting environment variables**:
   ```bash
   vercel --prod
   ```

## API Endpoints

Your backend will be available at:
- `https://your-app.vercel.app/api/auth/*` - Authentication endpoints
- `https://your-app.vercel.app/api/parent-bookings/*` - Booking management
- `https://your-app.vercel.app/api/admin/*` - Admin functionality
- `https://your-app.vercel.app/api/health` - Health check

## Database Setup

1. **Set up PostgreSQL database** (recommended: Supabase, Railway, or Neon)
2. **Run migrations**:
   ```bash
   # The migrations are in the migrations/ directory
   # You may need to run them manually on your database
   ```

## Testing the Deployment

1. **Health Check**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Test Authentication**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Ensure DATABASE_URL is correctly set
   - Check if your database allows connections from Vercel's IP ranges

2. **CORS Errors**:
   - Verify your domain is in the allowedOrigins array in api/serverless.js

3. **Environment Variables**:
   - Make sure all required environment variables are set in Vercel dashboard
   - Redeploy after adding environment variables

4. **Function Timeout**:
   - The maxDuration is set to 30 seconds
   - For longer operations, consider using background jobs

## Local Development

For local development, you can still use your existing setup:

```bash
# Start the frontend
npm run dev

# Start the backend (in another terminal)
node server.js
```

## Monitoring

- Use Vercel's built-in analytics and monitoring
- Check function logs in the Vercel dashboard
- Monitor database performance separately

## Security Notes

- All sensitive data should be in environment variables
- JWT tokens are used for authentication
- Rate limiting is enabled
- CORS is properly configured
- Input validation is implemented in routes

## Next Steps

1. Set up your database and run migrations
2. Configure all environment variables
3. Deploy to Vercel
4. Test all API endpoints
5. Update your frontend to use the new API URLs 