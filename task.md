You are tasked with integrating a tiered subscription model into a logistics tracking app (built with Vite + Supabase). The system supports real-time delivery updates and SMS notifications.

### 🎯 Objective:
Implement a **subscription and billing system** with the following requirements:

---

### 📦 Subscription Tiers:

| Tier         | Price (USD) | Max Deliveries | Free SMS | Features                     |
|--------------|-------------|----------------|----------|------------------------------|
| Starter      | $15         | 20             | 40 SMS   | Basic dashboard, SMS alerts |
| Basic        | $35         | 75             | 120 SMS  | Delivery history             |
| Pro          | $75         | 200            | 300 SMS  | Enhanced reports, filters    |
| Enterprise   | Custom      | Unlimited      | Bulk     | Custom branding, API access  |

---

### 🧾 Key Requirements:

1. **Schema Design** (Supabase):
   - Table: `subscriptions`
     - `userId` (foreign key to auth.users)
     - `tier` (enum: starter, basic, pro, enterprise)
     - `startDate`
     - `endDate`
     - `paymentMethod` (text)
     - `status` (active, trial, expired)
     - `deliveriesUsed` (integer)
     - `smsUsed` (integer)

   - Table: `invoices`
     - `invoiceId`
     - `userId`
     - `amount`
     - `currency`
     - `paid` (boolean)
     - `paymentDate`
     - `notes`

2. **Quota Enforcement**:
   - Limit delivery creation and SMS sending based on subscription tier
   - Show warning in dashboard when usage nears quota
   - Block delivery updates when quota is exceeded (unless on Enterprise)

3. **Subscription Logic**:
   - On user sign-up, assign “Starter” trial tier for 7 days
   - After trial, require upgrade to continue
   - Allow admin to manually change tiers (no full payment gateway needed in MVP)

4. **Admin Interface**:
   - View all users and their current subscription
   - View usage: deliveries and SMS
   - Change user tier manually (for now)

5. **Frontend Components**:
   - `BillingDashboard.jsx`:
     - Display current tier, SMS quota, deliveries remaining
     - Option to request upgrade (just a contact form for now)
   - `SubscriptionPlans.jsx`:
     - Show all tiers and benefits
     - Upgrade CTA

6. **Logic Hooks**:
   - `onCreateDelivery()`: check if `deliveriesUsed < max`
   - `onSendSMS()`: check if `smsUsed < allowedSMS`

7. **Environment Variables** (use mock):
   - Prices are hardcoded in config file
   - Payment system is optional/informational (mock gateway)

8. **Nice to Have**:
   - Display “Trial X days remaining”
   - Alert when within 10% of usage limit

---

### 🔐 Notes:
- Do not integrate real payment gateways for MVP.
- Assume admin upgrades users manually for now.
- Focus on logic, quota enforcement, and visibility in UI.

### 🎁 Bonus:
Add a feature flag `isTrialUser` to limit or enable premium features during onboarding.

