import React from 'react';
import { subscriptionTiers } from '../../config/subscriptions.js';

const tierOrder = ['starter', 'basic', 'pro', 'enterprise'];

export default function SubscriptionPlans() {
  
  const handleSelectPlan = (tier) => {
    // In a full implementation, this would lead to a checkout process.
    // For this MVP, it can open a mailto link or show a contact modal.
    window.location.href = `mailto:marketing@morreslogistics.com?subject=Morres Logistics Subscription Inquiry&body=I am interested in the ${subscriptionTiers[tier].name} plan.`;
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-6 fw-bold" style={{ color: '#1F2120' }}>Our Subscription Plans</h1>
        <p className="lead text-muted">Choose the plan that fits your logistics needs. All plans are powered by Dar Logistics Technology for real-time tracking and SMS updates.</p>
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
                      Contact Sales
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center text-muted small mt-5">
        <span className="badge bg-success text-white fs-6" style={{ background: '#16a34a', borderRadius: '0.5em', padding: '0.5em 1em' }}>
          Powered by Dar Logistics Technology
        </span>
        <div className="mt-2">
          For inquiries: <a href="mailto:marketing@morreslogistics.com" style={{ color: '#1F2120' }}>marketing@morreslogistics.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
        </div>
      </div>
    </div>
  );
} 