# Morres Logistics SMS Tracking System

An internal logistics system for real-time shipment tracking and automated SMS notifications. Built with Vite + React, Supabase, and Africa's Talking. Operators update checkpoints, customers track deliveries, and everyone gets instant status updates.

---

## Features
- Operator dashboard: create deliveries, update checkpoints
- Customer tracking page: real-time status and timeline
- SMS notifications at every checkpoint (Africa's Talking)
- Modern, mobile-friendly UI

---

## Tech Stack
- **Frontend:** Vite + React (hosted on Vercel)
- **Backend:** Node.js/Express (hosted on Render)
- **Database:** Supabase
- **SMS API:** Africa's Talking (Zimbabwe)

---

## Environment Variables
Create a `.env` file (or use your host's dashboard) with:

```
# Africa's Talking
AT_USERNAME=your_africas_talking_username
AT_API_KEY=your_africas_talking_api_key
AT_SENDER_ID=MorresLogistics

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# (Frontend only)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-backend.onrender.com
```

---

## Deployment Guide

### 1. GitHub
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/morres-logistics.git
git add .
git commit -m "Initial MVP commit"
git branch -M main
git push -u origin main
```

### 2. Vercel (Frontend)
- Import repo, set root to `/morres-app`
- Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- Deploy

### 3. Render (Backend)
- New Web Service, root `/morres-app`
- Build: `npm install`
- Start: `node server.js`
- Env vars: `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Deploy

### 4. Connect Frontend to Backend
- Update API URLs in frontend to use your Render backend URL via `VITE_API_URL`

---

## Usage & Testing
1. **Operator:** Log in, create a delivery, copy tracking code, update checkpoints.
2. **Customer:** Go to tracking page, enter tracking code, view status/timeline.
3. **SMS:** Receive SMS on checkpoint update and delivery creation (if enabled).
4. **Test:**
   - Create delivery with dummy data
   - Update checkpoint from dashboard
   - Verify SMS received
   - Track order as customer

---

## Data Model (Supabase)
- **deliveries**
  - trackingId: string (PK)
  - customerName: string
  - phoneNumber: string
  - currentStatus: string
  - checkpoints: array (location, timestamp, operator, comment)
  - driverDetails: { name, vehicleReg }

---

## License
MIT
