import React from 'react';
import { subscriptionTiers } from '../../config/subscriptions.js';

const tierOrder = ['starter', 'basic', 'pro', 'enterprise'];

export default function SubscriptionPlans() {
  
  const handleSelectPlan = (tier) => {
    // In a full implementation, this would lead to a checkout process.
    // For this MVP, it can open a mailto link or show a contact modal.
    alert(`You selected the ${subscriptionTiers[tier].name} plan. Please contact sales to upgrade.`);
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-6 fw-bold" style={{ color: '#1F2120' }}>Our Subscription Plans</h1>
        <p className="lead text-muted">Choose the plan that fits your logistics needs.</p>
      </div>
      <div className="row g-4 justify-content-center">
        {tierOrder.map(tierKey => {
          const tier = subscriptionTiers[tierKey];
          return (
            <div key={tierKey} className="col-lg-3 col-md-6">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-header text-center bg-light">
                  <h4 className="fw-bold mb-0">{tier.name}</h4>
                </div>
                <div className="card-body d-flex flex-column">
                  <h2 className="card-title text-center my-4">
                    {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
                    {typeof tier.price === 'number' && <small className="text-muted">/mo</small>}
                  </h2>
                  <ul className="list-unstyled mb-4">
                    <li className="mb-2">
                      <span className="material-icons-outlined align-middle me-2" style={{ color: '#D2691E' }}>check_circle</span>
                      <strong>{tier.maxDeliveries === Infinity ? 'Unlimited' : tier.maxDeliveries}</strong> Deliveries/mo
                    </li>
                    <li className="mb-2">
                      <span className="material-icons-outlined align-middle me-2" style={{ color: '#D2691E' }}>check_circle</span>
                      <strong>{tier.maxSms === Infinity ? 'Bulk' : tier.maxSms}</strong> SMS/mo
                    </li>
                    {tier.features.map((feature, index) => (
                      <li key={index} className="mb-2">
                        <span className="material-icons-outlined align-middle me-2" style={{ color: '#D2691E' }}>check_circle</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <button 
                      onClick={() => handleSelectPlan(tierKey)}
                      className="btn btn-primary w-100 fw-bold"
                      style={{ background: '#D2691E', border: 'none' }}
                      aria-label={`Select ${subscriptionTiers[tierKey].name} plan`}
                    >
                      Choose Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 