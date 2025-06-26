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
- **Database:** PostgreSQL on Render
- **SMS API:** Twilio

---

## Environment Variables
Create a `.env` file (or use your host's dashboard) with:

```
# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Database (Render)
DATABASE_URL=your_render_postgresql_connection_string

# (Frontend only)
VITE_API_URL=https://your-backend.onrender.com
```

### Local Development Setup
For local development, create a file named `.env.local` in the `morres-app` directory. This file is ignored by Git and will override production settings. Add the following to it:

```
VITE_API_URL=http://localhost:3000
```
This will point your local frontend to your local backend server. Remember to restart the Vite server after creating this file.

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
  - bookingReference: string
  - loadingPoint: string
  - commodity: string
  - containerCount: number
  - tonnage: number
  - destination: string
  - checkpoints: array (location, timestamp, operator, comment)
  - driverDetails: { name, vehicleReg }

---

## License
MIT

## CI/CD & App Pipeline

### Branching & Update Flow
- **Feature branches** (e.g., `feature/xyz`) are created from `main` for new work.
- After development, feature branches are merged into `main` via pull request or direct merge.
- `main` is the production branch and should always be deployable.
- After merging, always push `main` to remote: `git push origin main`.
- Delete feature branches after merge to keep repo clean.

### Deployment Pipeline
- **Frontend**: Vercel auto-deploys on push to `main`.
- **Backend**: Render auto-deploys on push to `main`.
- **Environment variables** are managed in Vercel/Render dashboards and `.env.local` (local only).
- **Database migrations** are managed via scripts in `/migrations`.

### Update/Release Steps
1. Pull latest `main`: `git pull origin main`
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes, commit, push: `git push origin feature/your-feature`
4. Merge to `main` (PR or direct): `git checkout main && git merge feature/your-feature`
5. Push `main`: `git push origin main`
6. Vercel/Render auto-deploys
7. Delete feature branch: `git branch -d feature/your-feature` and `git push origin --delete feature/your-feature`

## Branching & Release Workflow

### Branch Purposes
- **feature/tracking-updates**: Default development branch. All new features and bugfixes are merged here first.
- **staging**: Pre-production branch. Used for integration testing and QA before production. Only code that has passed review and basic tests is merged here.
- **prod**: Production branch. Only thoroughly tested, production-ready code is merged here. This branch is deployed to live environments.
- **stable**: Last known good, stable version. Updated only after a successful production deployment and verification.

### Workflow Steps
1. **Development**
   - Create a feature branch from `feature/tracking-updates` (e.g., `feature/your-feature`).
   - Work, commit, and push to your feature branch.
   - Open a pull request (PR) to merge into `feature/tracking-updates`.
   - After review, merge PR into `feature/tracking-updates`.

2. **Staging Preparation**
   - When ready for QA/testing, merge `feature/tracking-updates` into `staging`:
     ```bash
     git checkout staging
     git merge feature/tracking-updates
     git push origin staging
     ```
   - Deploy/verify on staging environment.
   - Run integration and acceptance tests.

3. **Production Release**
   - When staging passes all tests, merge `staging` into `prod`:
     ```bash
     git checkout prod
     git merge staging
     git push origin prod
     ```
   - Deploy to production/live environment.
   - Monitor for issues.

4. **Stable Update**
   - After production is verified stable, update the `stable` branch:
     ```bash
     git checkout stable
     git merge prod
     git push origin stable
     ```
   - Tag the release if desired (e.g., `v1.0.0`).

### Notes
- Never commit directly to `prod` or `stable`.
- Always use PRs for merging into `feature/tracking-updates`.
- Only merge into `staging` after code review and local tests.
- Only merge into `prod` after successful staging tests.
- Only update `stable` after production is confirmed healthy.

---
