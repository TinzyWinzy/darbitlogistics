# Vercel GUI Deployment Guide

## 🖥️ Vercel GUI Setup Steps

### 1. **Connect Your Repository**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub/GitLab repository
- Select your `DarLogistics` repository

### 2. **Configure Project Settings**
When Vercel asks for configuration:

**Framework Preset**: Select "Vite" or "Other"

**Build Settings**:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Root Directory**: Leave as `/` (root of your project)

### 3. **Environment Variables Setup**
In the Vercel dashboard, go to your project → Settings → Environment Variables:

**Add these required variables**:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

**Optional (for full functionality)**:
```
TEXTBEE_API_KEY=your_textbee_api_key
TEXTBEE_DEVICE_ID=your_textbee_device_id
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
PAYNOW_INTEGRATION_ID=your_paynow_integration_id
PAYNOW_INTEGRATION_KEY=your_paynow_integration_key
```

### 4. **Deploy**
- Click "Deploy"
- Vercel will automatically detect your configuration from `vercel.json`
- The build process will create both frontend and backend

### 5. **Verify Deployment**
After deployment, test these endpoints:

**Health Check**:
```
https://your-app.vercel.app/api/health
```

**API Endpoints**:
```
https://your-app.vercel.app/api/auth/*
https://your-app.vercel.app/api/parent-bookings/*
https://your-app.vercel.app/api/admin/*
```

## 🔧 What Vercel Will Do Automatically

Your `vercel.json` tells Vercel to:
- ✅ Build your frontend from `package.json` (npm run build)
- ✅ Deploy your backend from `api/index.js`
- ✅ Route `/api/*` requests to your serverless function
- ✅ Route everything else to your frontend

## 🎯 Key Benefits of GUI Setup

- **Automatic Detection**: Vercel reads your `vercel.json`
- **Easy Environment Variables**: GUI makes it simple to add secrets
- **Automatic Deployments**: Every push to main branch auto-deploys
- **Built-in Monitoring**: View logs and performance in dashboard

## 🛠 Local Development Commands

```bash
# Frontend (Vite development server)
npm run dev

# Backend (Express server)
npm start
```

## 🔍 After Deployment

1. **Test your API**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Check Function Logs**:
   - Go to Vercel Dashboard → Functions tab
   - View logs for any errors

3. **Monitor Performance**:
   - Use Vercel Analytics
   - Check Function execution times

## 📊 Monitoring & Debugging

- **Function Logs**: Vercel Dashboard → Functions → View Logs
- **Build Logs**: Vercel Dashboard → Deployments → View Build Logs
- **Environment Variables**: Settings → Environment Variables
- **Domain Settings**: Settings → Domains

Your fresh backend setup is now ready for GUI deployment! 🎉 