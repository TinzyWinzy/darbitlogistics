# 🚀 DarLogistics Vercel Deployment Guide

## **Current Setup Analysis**

Your DarLogistics app is a **full-stack application** with:
- **Frontend**: React + Vite (SPA)
- **Backend**: Express.js with PostgreSQL
- **Mobile**: Capacitor for Android/iOS
- **Database**: Supabase (PostgreSQL)
- **PWA**: Service Worker enabled

## **🔧 Vercel Configuration**

### **1. Project Structure**
```
DarLogistics/
├── src/                    # Frontend React code
├── public/                 # Static assets
├── api/                    # Vercel serverless functions
│   ├── index.js           # Main API entry point
│   └── package.json       # API dependencies
├── package.json           # Frontend dependencies
├── vite.config.js         # Vite configuration
└── vercel.json           # Vercel configuration
```

### **2. Environment Variables**

**Frontend Variables (VITE_ prefix):**
```bash
VITE_API_URL=https://your-vercel-app.vercel.app/api
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Backend Variables:**
```bash
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=your-postgresql-connection-string
TEXTBEE_API_KEY=your-textbee-api-key
TEXTBEE_DEVICE_ID=your-textbee-device-id
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
PAYNOW_INTEGRATION_ID=your-paynow-integration-id
PAYNOW_INTEGRATION_KEY=your-paynow-integration-key
EMAIL_HOST=your-email-host
EMAIL_PORT=587
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password
```

### **3. Vercel Setup Steps**

#### **Step 1: Install Vercel CLI**
```bash
npm i -g vercel
```

#### **Step 2: Login to Vercel**
```bash
vercel login
```

#### **Step 3: Deploy**
```bash
vercel
```

#### **Step 4: Set Environment Variables**
```bash
vercel env add VITE_API_URL
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add JWT_SECRET
vercel env add DATABASE_URL
# ... add all other environment variables
```

### **4. Build Configuration**

The `vercel.json` is configured to:
- Build the frontend using Vite
- Serve static files from `dist/` directory
- Route API calls to `/api/*` endpoints
- Handle SPA routing with fallback to `index.html`

### **5. API Structure**

The API is structured as serverless functions:
- `/api/index.js` - Main API entry point
- `/api/auth/*` - Authentication routes
- `/api/parent-bookings/*` - Booking routes
- `/api/admin/*` - Admin routes

### **6. Database Setup**

**Option A: Supabase (Recommended)**
- Use Supabase for PostgreSQL
- Set `DATABASE_URL` to Supabase connection string
- Configure CORS in Supabase dashboard

**Option B: Vercel Postgres**
- Use Vercel's managed PostgreSQL
- Automatically configured with Vercel

### **7. Custom Domain Setup**

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Domains
4. Add your custom domain
5. Update CORS origins in API

### **8. Monitoring & Analytics**

- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Automatic error reporting
- **Function Logs**: View API function logs in Vercel dashboard

## **🚨 Important Notes**

1. **Database**: Ensure your PostgreSQL database is accessible from Vercel's serverless functions
2. **CORS**: Update allowed origins in `/api/index.js` when deploying
3. **Environment Variables**: All sensitive data should be in Vercel environment variables
4. **API Limits**: Vercel has execution time limits for serverless functions
5. **File Uploads**: Use external storage (Supabase Storage) for file uploads

## **🔗 Useful Commands**

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployment logs
vercel logs

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME
```

## **📱 Mobile App Deployment**

For the Capacitor mobile app:
1. Build the web app: `npm run build`
2. Sync with Capacitor: `npx cap sync`
3. Build for platforms: `npx cap build android/ios`

## **🎯 Next Steps**

1. Set up environment variables in Vercel dashboard
2. Configure your database connection
3. Test API endpoints
4. Set up custom domain
5. Configure monitoring and alerts 