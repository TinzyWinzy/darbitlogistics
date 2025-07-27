const subscriptionTiers = {
  payAsYouGo: {
    name: 'Pay-as-you-Go',
    price: 1.00,
    maxDeliveries: 1,
    maxSms: 2,
    features: ['Single tracked delivery', 'SMS updates', 'No signup required'],
  },
  starter: {
    name: 'Starter',
    price: 15,
    maxDeliveries: 50,
    maxSms: 100,
    features: ['Basic dashboard', 'SMS alerts', 'Delivery history'],
  },
  basic: {
    name: 'Basic',
    price: 35,
    maxDeliveries: 150,
    maxSms: 300,
    features: ['Enhanced reports', 'Filters', 'Bulk operations'],
  },
  pro: {
    name: 'Pro',
    price: 75,
    maxDeliveries: 400,
    maxSms: 'Bulk rates',
    features: ['Advanced analytics', 'Custom branding', 'API access'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    maxDeliveries: Infinity,
    maxSms: 'Custom',
    features: ['Custom branding', 'API access', 'SLA support', 'Team accounts'],
  },
};

const addOns = {
  extraDeliveries: {
    name: 'Extra Deliveries',
    price: 0.25,
    description: 'For exceeding monthly plan limits'
  },
  smsTopUp: {
    name: 'SMS Top-Up',
    price: 2.00,
    description: 'Per 100 SMS - automatic billing when threshold reached'
  },
  brandedPortal: {
    name: 'Branded Tracking Portal',
    price: 10.00,
    description: 'Custom portal with company logo/domain'
  },
  proofOfDelivery: {
    name: 'Proof of Delivery (POD)',
    price: 5.00,
    description: 'Photo/signature uploads at checkpoints'
  },
  gpsTracker: {
    name: 'GPS Tracker (Beta)',
    price: 10.00,
    description: 'Live tracking with optional GPS hardware'
  }
};

const trialSettings = {
  tier: 'starter',
  durationDays: 7
};

export { subscriptionTiers, addOns, trialSettings }; 