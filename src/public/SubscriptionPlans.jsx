import React, { useEffect, useState, useContext } from 'react';
import { subscriptionTiers } from '../../config/subscriptions.js';
import { deliveryApi } from '../services/api.js';
import { AuthContext } from '../services/AuthContext';

const tierOrder = ['starter', 'basic', 'pro', 'enterprise'];

export default function SubscriptionPlans() {
  const { user } = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    deliveryApi.getMyAllSubscriptions?.()
      .then(setSubscriptions)
      .catch(err => setError(err.response?.data?.error || 'Failed to fetch subscriptions.'))
      .finally(() => setLoading(false));
  }, [user, creating]);

  const handleSelectPlan = async (tierKey) => {
    setSelectedTier(tierKey);
    setCreateMsg('');
    setCreating(true);
    try {
      // Placeholder: In future, trigger Paynow payment flow here
      await deliveryApi.createSubscription({ tier: tierKey });
      setCreateMsg('Subscription request created! Complete payment to activate.');
    } catch (err) {
      setCreateMsg(err.response?.data?.error || 'Failed to create subscription.');
    }
    setCreating(false);
  };

  // Find the current/active subscription
  const activeSub = subscriptions.find(sub => sub.status === 'active' && new Date(sub.end_date) > new Date());
  const historySubs = subscriptions.filter(sub => !activeSub || sub.id !== activeSub.id);

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-6 fw-bold" style={{ color: '#1F2120' }}>Our Subscription Plans</h1>
        <p className="lead text-muted">Choose the plan that fits your logistics needs. All plans include real-time tracking and SMS updates.</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {createMsg && <div className="alert alert-info">{createMsg}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {activeSub && (
            <div className="card mb-4 shadow-sm border-0">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0 fw-bold" style={{ color: '#1F2120' }}>Current Plan</h2>
                <span className={`badge bg-success text-uppercase`}>{subscriptionTiers[activeSub.tier]?.name || activeSub.tier} ({activeSub.status})</span>
              </div>
              <div className="card-body">
                <div>Start: {new Date(activeSub.start_date).toLocaleDateString()}</div>
                <div>End: {new Date(activeSub.end_date).toLocaleDateString()}</div>
                <div>Deliveries Used: {activeSub.deliveries_used}</div>
                <div>SMS Used: {activeSub.sms_used}</div>
              </div>
            </div>
          )}
          <div className="row g-4 justify-content-center mb-4">
            {tierOrder.map(tierKey => {
              const tier = subscriptionTiers[tierKey];
              const isCurrent = activeSub && activeSub.tier === tierKey;
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
                          aria-label={`Select ${tier.name} plan`}
                          disabled={isCurrent || creating}
                        >
                          {isCurrent ? 'Current Plan' : 'Select Plan'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <h4 className="fw-bold mb-3">Subscription History</h4>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Deliveries Used</th>
                  <th>SMS Used</th>
                </tr>
              </thead>
              <tbody>
                {historySubs.length === 0 ? (
                  <tr><td colSpan={6}>No previous subscriptions.</td></tr>
                ) : (
                  historySubs.map(sub => (
                    <tr key={sub.id}>
                      <td>{subscriptionTiers[sub.tier]?.name || sub.tier}</td>
                      <td>{sub.status}</td>
                      <td>{new Date(sub.start_date).toLocaleDateString()}</td>
                      <td>{new Date(sub.end_date).toLocaleDateString()}</td>
                      <td>{sub.deliveries_used}</td>
                      <td>{sub.sms_used}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="text-center text-muted small mt-5">
            <span className="badge bg-primary text-white fs-6" style={{ borderRadius: '0.5em', padding: '0.5em 1em' }}>
              Morres Logistics — Secure. Scalable. Strategic.
            </span>
            <div className="mt-2">
              For inquiries: <a href="mailto:info@morres.com" style={{ color: '#1F2120' }}>info@morres.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
            </div>
            <div className="mt-3">
              {/* Placeholder for Paynow payment integration */}
              <span className="text-info">Paynow payment integration coming soon: mobile money, Ecocash, and more!</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 