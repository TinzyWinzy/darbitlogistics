const subscriptionTiers = {
  starter: {
    name: 'Starter',
    price: 15,
    maxDeliveries: 20,
    maxSms: 40,
    features: ['Basic dashboard', 'SMS alerts'],
  },
  basic: {
    name: 'Basic',
    price: 35,
    maxDeliveries: 75,
    maxSms: 120,
    features: ['Delivery history'],
  },
  pro: {
    name: 'Pro',
    price: 75,
    maxDeliveries: 200,
    maxSms: 300,
    features: ['Enhanced reports', 'filters'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    maxDeliveries: Infinity,
    maxSms: Infinity,
    features: ['Custom branding', 'API access'],
  },
};

const trialSettings = {
  tier: 'starter',
  durationDays: 7
};

export { subscriptionTiers, trialSettings }; 