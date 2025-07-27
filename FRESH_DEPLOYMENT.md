# Fresh Vercel Backend Deployment

## 🚀 Quick Start

Your DarLogistics app now has a clean, fresh backend setup for Vercel deployment.

## 📋 What's Included

- ✅ Clean Express.js serverless function
- ✅ Authentication system
- ✅ Database integration (PostgreSQL)
- ✅ CORS properly configured for Vercel
- ✅ Health check endpoint
- ✅ Frontend API configuration updated

## 🔧 Environment Variables

Set these in your Vercel dashboard:

### Required
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

### Optional (for full functionality)
```
TEXTBEE_API_KEY=your_textbee_api_key
TEXTBEE_DEVICE_ID=your_textbee_device_id
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
PAYNOW_INTEGRATION_ID=your_paynow_integration_id
PAYNOW_INTEGRATION_KEY=your_paynow_integration_key
```

## 🚀 Deploy Steps

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables above

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

## 🧪 Test Your Deployment

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

## 📁 Project Structure

```
├── api/
│   ├── index.js          # Main serverless function
│   └── package.json      # API dependencies
├── src/
│   ├── services/
│   │   └── api.js        # Updated frontend API config
│   └── ...
├── routes/               # Your existing routes
├── controllers/          # Your existing controllers
├── config/              # Database and other configs
└── vercel.json          # Vercel configuration
```

## 🔗 API Endpoints

Your backend will be available at:
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/auth/*` - Authentication
- `https://your-app.vercel.app/api/parent-bookings/*` - Bookings
- `https://your-app.vercel.app/api/admin/*` - Admin functions

## 🛠 Local Development

```bash
# Frontend (Vite dev server)
npm run dev

# Backend (Express server)
npm start
```

## 🔍 Troubleshooting

### Common Issues:

1. **Database Connection**:
   - Ensure DATABASE_URL is correct
   - Check if database allows Vercel connections

2. **CORS Errors**:
   - Your domain is already in the allowed origins
   - Check browser console for specific errors

3. **Environment Variables**:
   - Make sure all required vars are set
   - Redeploy after adding variables

4. **Function Timeout**:
   - Max duration is 30 seconds
   - For longer operations, consider background jobs

## 📊 Monitoring

- Check Vercel Function Logs in dashboard
- Monitor database performance separately
- Use Vercel Analytics for frontend metrics

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set environment variables
3. ✅ Test API endpoints
4. ✅ Update frontend if needed
5. ✅ Monitor performance

Your app is now ready for production! 🎉 