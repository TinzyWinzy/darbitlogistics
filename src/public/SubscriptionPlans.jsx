import React, { useEffect, useState, useContext } from 'react';
import { subscriptionTiers } from '../../config/subscriptions.js';
import { deliveryApi } from '../services/api.js';
import { AuthContext } from '../App';
import { FaRegStar, FaRegCheckCircle, FaRegEnvelope, FaRegChartBar, FaRegListAlt, FaRegBell, FaRegUser, FaRegBuilding, FaRegPaperPlane, FaCrown, FaRegQuestionCircle } from 'react-icons/fa';

const tierOrder = ['starter', 'basic', 'pro', 'enterprise'];
const tierIcons = {
  starter: <FaRegStar color="#EBD3AD" size={28} title="Starter" />,
  basic: <FaRegListAlt color="#D2691E" size={28} title="Basic" />,
  pro: <FaCrown color="#1976d2" size={28} title="Pro (Recommended)" />,
  enterprise: <FaRegBuilding color="#1F2120" size={28} title="Enterprise" />,
};
const featureIcons = {
  'Basic dashboard': <FaRegUser color="#1976d2" style={{ marginRight: 6 }} />,
  'SMS alerts': <FaRegBell color="#1976d2" style={{ marginRight: 6 }} />,
  'Delivery history': <FaRegChartBar color="#1976d2" style={{ marginRight: 6 }} />,
  'Enhanced reports': <FaRegChartBar color="#1976d2" style={{ marginRight: 6 }} />,
  'filters': <FaRegQuestionCircle color="#1976d2" style={{ marginRight: 6 }} />,
  'Custom branding': <FaRegEnvelope color="#1976d2" style={{ marginRight: 6 }} />,
  'API access': <FaRegPaperPlane color="#1976d2" style={{ marginRight: 6 }} />,
};

export default function SubscriptionPlans() {
  const { user } = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [createMsg, setCreateMsg] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  // Add state for add-on payment
  const [addonLoading, setAddonLoading] = useState(false);
  const [addonError, setAddonError] = useState('');
  const [deliveryQty, setDeliveryQty] = useState(1);
  const [smsQty, setSmsQty] = useState(100);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('You must be logged in to view subscription plans.');
      return;
    }
    setLoading(true);
    deliveryApi.getMyAllSubscriptions()
      .then(subs => setSubscriptions(subs || []))
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to fetch subscription.';
        if (msg.includes('No active subscription found') || msg.includes('expired')) {
          setError('Your subscription is inactive or expired. Please upgrade your plan to continue.');
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [user, creating]);

  const handleSelectPlan = async (tierKey) => {
    setSelectedTier(tierKey);
    setCreateMsg('');
    setCreating(true);
    try {
      // Call backend to create subscription and get Paynow payment URL
      const response = await deliveryApi.createSubscription({ tier: tierKey });
      if (response && response.paynowUrl) {
        // Redirect to Paynow for payment
        window.location.href = response.paynowUrl;
        return;
      }
      setCreateMsg('Subscription request created, but payment link was not returned. Please contact support.');
    } catch (err) {
      setCreateMsg(err.response?.data?.error || 'Failed to create subscription or initiate payment.');
    }
    setCreating(false);
  };

  // Helper function to calculate remaining days (from BillingDashboard)
  const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = Math.max(end - today, 0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Find the current/active subscription
  const activeSub = subscriptions.find(sub => sub.status === 'active' || sub.status === 'trial');
  const historySubs = subscriptions.filter(sub => sub !== activeSub);

  // Defensive: prefer tierDetails, then root fields, then config
  const tierDetails = activeSub?.tierDetails && Object.keys(activeSub.tierDetails).length > 0
    ? activeSub.tierDetails
    : (activeSub || {});
  const planConfig = subscriptionTiers[activeSub?.tier] || {};
  const planName = tierDetails.name || activeSub?.name || planConfig.name || activeSub?.tier;
  const maxDeliveries = Number(tierDetails.maxDeliveries || activeSub?.maxDeliveries || planConfig.maxDeliveries);
  const maxSms = Number(tierDetails.maxSms || activeSub?.maxSms || planConfig.maxSms);
  const features = tierDetails.features || activeSub?.features || planConfig.features || [];
  const deliveriesUsed = Number(activeSub?.deliveries_used) || 0;
  const deliveryQuotaPercentage =
    maxDeliveries && isFinite(maxDeliveries) && maxDeliveries > 0
      ? Math.min((deliveriesUsed / maxDeliveries) * 100, 100)
      : 0;

  const smsUsed = Number(activeSub?.sms_used) || 0;
  const smsQuotaPercentage =
    maxSms && isFinite(maxSms) && maxSms > 0
      ? Math.min((smsUsed / maxSms) * 100, 100)
      : 0;

  const remainingDays = activeSub ? getRemainingDays(activeSub.end_date) : null;

  const handleRequestUpgrade = () => {
    window.location.href = 'mailto:sales@morreslogistics.com?subject=Subscription Upgrade Request';
  };

  const handleUpgrade = async (planId) => {
    setLoadingPlanId(planId);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError('Payment initiation failed.');
      }
    } catch (e) {
      setError('Payment initiation failed.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  // Handler for Paynow add-on purchase
  const handleAddonPaynow = async (addonType) => {
    setAddonLoading(true);
    setAddonError('');
    let quantity = addonType === 'extra_delivery' ? deliveryQty : smsQty;
    try {
      const response = await deliveryApi.createAddonPurchase({ type: addonType, quantity });
      if (response && response.paynowUrl) {
        window.location.href = response.paynowUrl;
        return;
      }
      setAddonError('Payment link was not returned. Please contact support.');
    } catch (err) {
      setAddonError(err.response?.data?.error || 'Failed to initiate add-on payment.');
    }
    setAddonLoading(false);
  };

  // Tab content renderers
  const renderCurrentPlan = () => (
    <>
      {activeSub && (
        <div className="card mb-4 shadow border-0" style={{ background: '#fcf8f3', borderLeft: '6px solid #1976d2' }}>
          <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap">
            <h2 className="h5 mb-0 fw-bold" style={{ color: '#1F2120' }}>Current Plan</h2>
            <span className={`badge bg-${activeSub.status === 'active' ? 'success' : 'warning'} text-uppercase mt-2 mt-md-0`}>
              {planName} ({activeSub.status})
            </span>
          </div>
          <div className="card-body">
            <div className="row g-4 mb-4">
              <div className="col-12 col-md-6">
                <div className="mb-3">
                  <h6 className="fw-bold">Deliveries Quota</h6>
                  <p className="text-muted mb-1">
                    {deliveriesUsed} / {maxDeliveries === Infinity ? 'Unlimited' : maxDeliveries} used
                  </p>
                  <div className="progress" style={{ height: '20px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${deliveryQuotaPercentage}%`, backgroundColor: '#D2691E' }}
                      aria-valuenow={deliveryQuotaPercentage} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    >
                      {Math.round(deliveryQuotaPercentage)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="mb-3">
                  <h6 className="fw-bold">SMS Quota</h6>
                  <p className="text-muted mb-1">
                    {smsUsed} / {maxSms === Infinity ? 'Unlimited' : maxSms} used
                  </p>
                  <div className="progress" style={{ height: '20px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${smsQuotaPercentage}%`, backgroundColor: '#D2691E' }}
                      aria-valuenow={smsQuotaPercentage} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    >
                      {Math.round(smsQuotaPercentage)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {features.length > 0 && (
              <div className="mb-3">
                <h6 className="fw-bold">Features</h6>
                <ul className="list-unstyled mb-0">
                  {features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {activeSub.status === 'trial' && remainingDays !== null && (
              <div className="alert alert-info">
                <strong>Your trial expires in {remainingDays} day{remainingDays !== 1 && 's'}.</strong>
              </div>
            )}
            <hr className="my-4" />
            <div className="text-center mb-3">
              <h5 className="mb-3">Need more capacity?</h5>
              <button 
                className="btn btn-primary fw-bold"
                style={{ background: '#D2691E', border: 'none' }}
                onClick={handleRequestUpgrade}
              >
                Request an Upgrade
              </button>
              <p className="text-muted mt-2 small">
                Our team will contact you to discuss your needs.
              </p>
            </div>
            <div className="alert alert-secondary text-center small mb-0" style={{ background: '#fffbe6', color: '#1F2120' }}>
              <strong>Contact Finance:</strong> jackfeng@morres.com | +263 78 888 8886
            </div>
            <div className="text-center text-muted mt-2 small">
              For internal operations. Not for public distribution.
            </div>
          </div>
        </div>
      )}
      {!activeSub && !error && (
        <div className="alert alert-warning">
          You do not have an active subscription. Please contact support.
        </div>
      )}
    </>
  );

  const renderPlanSelection = () => (
    <div className="row g-4 justify-content-center mb-4">
      {tierOrder.map(tierKey => {
        // Prefer config for plan selection, not user sub
        const tier = subscriptionTiers[tierKey];
        const isCurrent = activeSub && activeSub.tier === tierKey;
        const isRecommended = tierKey === 'pro';
        const isEnterprise = tierKey === 'enterprise';
        const quotas = {
          starter: { deliveries: tier?.maxDeliveries || 50, sms: tier?.maxSms || 100, desc: 'Owner-drivers, field agents' },
          basic: { deliveries: tier?.maxDeliveries || 150, sms: tier?.maxSms || 300, desc: 'Small to mid-size transporters' },
          pro: { deliveries: tier?.maxDeliveries || 400, sms: tier?.maxSms || 800, desc: 'Fleet operators, courier networks' },
          enterprise: { deliveries: 'Unlimited', sms: 'Bulk', desc: 'Large firms & integrations' },
        };
        return (
          <div key={tierKey} className="col-lg-3 col-md-6">
            <div className={`card h-100 shadow border-0 position-relative ${isRecommended ? 'border-primary' : ''}`} style={{ borderWidth: isRecommended ? 2 : 1, borderColor: isRecommended ? '#1976d2' : '#eee', boxShadow: isRecommended ? '0 4px 24px rgba(25,118,210,0.08)' : undefined }}>
              {isRecommended && (
                <span className="position-absolute top-0 end-0 badge bg-primary text-white" style={{ borderRadius: '0 0.5rem 0 0.5rem', fontSize: '0.95em', zIndex: 2 }}>Recommended</span>
              )}
              <div className="card-header text-center bg-light" style={{ borderBottom: 'none' }}>
                <div className="mb-2">{tierIcons[tierKey]}</div>
                <h4 className="fw-bold mb-0">{tier.name}</h4>
              </div>
              <div className="card-body d-flex flex-column">
                <h2 className="card-title text-center my-3">
                  {typeof tier.price === 'number' ? `$${tier.price}/mo` : tier.price}
                </h2>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2"><b>{quotas[tierKey]?.deliveries ?? tier.maxDeliveries}</b> Deliveries</li>
                  <li className="mb-2"><b>{quotas[tierKey]?.sms ?? tier.maxSms}</b> SMS</li>
                  <li className="mb-2">{quotas[tierKey]?.desc}</li>
                  {tier.features && tier.features.length > 0 && (
                    <li className="mb-2">
                      <b>Features:</b> {tier.features.join(', ')}
                    </li>
                  )}
                </ul>
                <div className="mt-auto">
                  {isEnterprise ? (
                    <a href="mailto:jackfeng@morres.com" className="btn fw-bold w-100" style={{ background: '#1F2120', color: '#EBD3AD', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem' }} aria-label="Contact for Enterprise plan">Contact Us</a>
                  ) : (
                    <button onClick={() => handleSelectPlan(tierKey)} className="btn fw-bold w-100" style={{ background: '#1F2120', color: '#EBD3AD', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem' }} aria-label={`Select ${tier.name} plan`} disabled={isCurrent || creating}>{isCurrent ? 'Current Plan' : 'Select Plan'}</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAddOns = () => (
    <div className="row justify-content-center mb-4">
      <div className="col-lg-6 col-md-8">
        <div className="card shadow border-0 mb-3">
          <div className="card-header bg-light text-center">
            <h5 className="fw-bold mb-0">Add-Ons & Features</h5>
          </div>
          <div className="card-body text-center">
            <div className="mb-2 d-flex justify-content-between align-items-center">
              <span><b>Extra Deliveries</b> – $0.25 per delivery</span>
              <input type="number" min={1} value={deliveryQty} onChange={e => setDeliveryQty(Math.max(1, Number(e.target.value)))} style={{ width: 60, marginRight: 8 }} disabled={addonLoading} />
              <button className="btn btn-sm btn-success ms-2" onClick={() => handleAddonPaynow('extra_delivery')} disabled={addonLoading || deliveryQty < 1}>
                {addonLoading ? 'Processing...' : 'Paynow'}
              </button>
            </div>
            <div className="mb-2 d-flex justify-content-between align-items-center">
              <span><b>SMS Top-up</b> – $2 / 100 SMS</span>
              <input type="number" min={100} step={100} value={smsQty} onChange={e => setSmsQty(Math.max(100, Math.floor(Number(e.target.value) / 100) * 100))} style={{ width: 80, marginRight: 8 }} disabled={addonLoading} />
              <button className="btn btn-sm btn-success ms-2" onClick={() => handleAddonPaynow('sms_topup')} disabled={addonLoading || smsQty < 100}>
                {addonLoading ? 'Processing...' : 'Paynow'}
              </button>
            </div>
            {addonError && <div className="alert alert-danger mt-3">{addonError}</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="mt-5 pt-4 border-top" style={{ borderColor: '#eee' }}>
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
            {subscriptions.length === 0 ? (
              <tr><td colSpan={6}>No previous subscriptions.</td></tr>
            ) : (
              [...subscriptions].sort((a, b) => new Date(b.start_date) - new Date(a.start_date)).map(sub => {
                const planConfig = subscriptionTiers[sub.tier] || {};
                return (
                  <tr key={sub.id || sub.tier}>
                    <td>{planConfig.name || sub.tier}</td>
                    <td>{sub.status}</td>
                    <td>{new Date(sub.start_date).toLocaleDateString()}</td>
                    <td>{new Date(sub.end_date).toLocaleDateString()}</td>
                    <td>{Number(sub.deliveries_used) || 0}</td>
                    <td>{Number(sub.sms_used) || 0}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="display-6 fw-bold" style={{ color: '#1F2120' }}>Subscription Plans</h1>
        <div className="lead text-muted mb-2">All plans include <b>real-time tracking</b>, <b>secure billing</b>, and <b>priority support</b>.</div>
      </div>
      {error && (
        <div className="alert alert-danger">
          {error}
          {(error.includes('inactive') || error.includes('expired')) && (
            <button className="btn btn-sm btn-primary ms-2" onClick={() => setActiveTab('plans')}>
              View Plans & Upgrade
            </button>
          )}
          {error.includes('login') && <a href="/login" className="btn btn-sm btn-primary ms-2">Login</a>}
        </div>
      )}
      {createMsg && <div className="alert alert-info">{createMsg}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Tab Navigation */}
          <ul className="nav nav-tabs mb-4 justify-content-center" style={{ borderBottom: '2px solid #eee' }}>
            <li className="nav-item">
              <button className={`nav-link${activeTab === 'current' ? ' active' : ''}`} onClick={() => setActiveTab('current')}>Current Plan</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link${activeTab === 'plans' ? ' active' : ''}`} onClick={() => setActiveTab('plans')}>Plan Selection</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link${activeTab === 'addons' ? ' active' : ''}`} onClick={() => setActiveTab('addons')}>Add-Ons</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link${activeTab === 'history' ? ' active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
            </li>
          </ul>
          {/* Tab Content */}
          {activeTab === 'current' && renderCurrentPlan()}
          {activeTab === 'plans' && renderPlanSelection()}
          {activeTab === 'addons' && renderAddOns()}
          {activeTab === 'history' && renderHistory()}
        </>
      )}
    </div>
  );
} 