import React, { useEffect, useState, useContext } from 'react';
import { subscriptionTiers } from '../../config/subscriptions.js';
import { deliveryApi } from '../services/api.js';
import { AuthContext } from '../contexts/AuthContext';
import { FaRegStar, FaRegCheckCircle, FaRegEnvelope, FaRegChartBar, FaRegListAlt, FaRegBell, FaRegUser, FaRegBuilding, FaRegPaperPlane, FaCrown, FaRegQuestionCircle, FaShieldAlt, FaTruck, FaGlobe, FaChartLine, FaUsers, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { normalizeKeys } from '../services/normalizeKeys';

const tierOrder = ['starter', 'basic', 'pro', 'enterprise'];
const tierIcons = {
  starter: <FaRegStar color="#FF6600" size={32} title="Starter" />,
  basic: <FaRegListAlt color="#FF6600" size={32} title="Basic" />,
  pro: <FaCrown color="#FF6600" size={32} title="Pro (Recommended)" />,
  enterprise: <FaRegBuilding color="#FF6600" size={32} title="Enterprise" />,
};
const featureIcons = {
  'Basic dashboard': <FaRegUser color="#FF6600" style={{ marginRight: 8 }} />,
  'SMS alerts': <FaRegBell color="#FF6600" style={{ marginRight: 8 }} />,
  'Delivery history': <FaRegChartBar color="#FF6600" style={{ marginRight: 8 }} />,
  'Enhanced reports': <FaRegChartBar color="#FF6600" style={{ marginRight: 8 }} />,
  'filters': <FaRegQuestionCircle color="#FF6600" style={{ marginRight: 8 }} />,
  'Custom branding': <FaRegEnvelope color="#FF6600" style={{ marginRight: 8 }} />,
  'API access': <FaRegPaperPlane color="#FF6600" style={{ marginRight: 8 }} />,
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
      .then(subs => setSubscriptions(normalizeKeys(subs || [])))
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
  const deliveriesUsed = Number(activeSub?.deliveriesUsed) || 0;
  const deliveryQuotaPercentage =
    maxDeliveries && isFinite(maxDeliveries) && maxDeliveries > 0
      ? Math.min((deliveriesUsed / maxDeliveries) * 100, 100)
      : 0;

  const smsUsed = Number(activeSub?.smsUsed) || 0;
  const smsQuotaPercentage =
    maxSms && isFinite(maxSms) && maxSms > 0
      ? Math.min((smsUsed / maxSms) * 100, 100)
      : 0;

  const remainingDays = activeSub ? getRemainingDays(activeSub.endDate) : null;

  const handleRequestUpgrade = () => {
    window.location.href = 'mailto:support@darlogistics.co.zw?subject=Subscription Upgrade Request';
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
        <div className="current-plan-card">
          <div className="plan-header">
            <div className="plan-title-section">
              <h2 className="plan-title">Current Plan</h2>
              <div className="plan-badge">
                <span className="badge-text">{planName}</span>
                <span className={`status-badge ${activeSub.status === 'active' ? 'active' : 'trial'}`}>
                  {activeSub.status}
                </span>
              </div>
            </div>
          </div>
          <div className="plan-content">
            <div className="quota-section">
              <div className="quota-item">
                <div className="quota-header">
                  <h6 className="quota-title">Deliveries Quota</h6>
                  <span className="quota-usage">
                    {deliveriesUsed} / {maxDeliveries === Infinity ? 'Unlimited' : maxDeliveries} used
                  </span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${deliveryQuotaPercentage}%` }}
                    >
                      <span className="progress-text">{Math.round(deliveryQuotaPercentage)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="quota-item">
                <div className="quota-header">
                  <h6 className="quota-title">SMS Quota</h6>
                  <span className="quota-usage">
                    {smsUsed} / {maxSms === Infinity ? 'Unlimited' : maxSms} used
                  </span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${smsQuotaPercentage}%` }}
                    >
                      <span className="progress-text">{Math.round(smsQuotaPercentage)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {features.length > 0 && (
              <div className="features-section">
                <h6 className="features-title">Features</h6>
                <div className="features-grid">
                  {features.map((f, i) => (
                    <div key={i} className="feature-item">
                      <FaRegCheckCircle className="feature-icon" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSub.status === 'trial' && remainingDays !== null && (
              <div className="trial-alert">
                <FaClock className="alert-icon" />
                <div className="alert-content">
                  <strong>Trial expires in {remainingDays} day{remainingDays !== 1 && 's'}.</strong>
                  <span>Upgrade now to continue using all features.</span>
                </div>
              </div>
            )}
            <div className="upgrade-section">
              <h5 className="upgrade-title">Need more capacity?</h5>
              <button 
                className="upgrade-btn"
                onClick={handleRequestUpgrade}
              >
                <FaTruck className="btn-icon" />
                Request an Upgrade
              </button>
              <p className="upgrade-note">
                Our team will contact you to discuss your needs.
              </p>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <FaRegEnvelope className="contact-icon" />
                <span>support@darlogistics.co.zw</span>
              </div>
              <div className="contact-item">
                <FaUsers className="contact-icon" />
                <span>+263 781 334474</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {!activeSub && !error && (
        <div className="no-plan-alert">
          <FaShieldAlt className="alert-icon" />
          <div className="alert-content">
            <h5>No Active Subscription</h5>
            <p>You do not have an active subscription. Please contact support to get started.</p>
          </div>
        </div>
      )}
    </>
  );

  const renderPlanSelection = () => (
    <div className="plans-grid">
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
          <div key={tierKey} className={`plan-card ${isRecommended ? 'recommended' : ''} ${isCurrent ? 'current' : ''}`}>
            {isRecommended && (
              <div className="recommended-badge">
                <FaCrown className="badge-icon" />
                <span>Recommended</span>
              </div>
            )}
            <div className="plan-header">
              <div className="plan-icon">
                {tierIcons[tierKey]}
              </div>
              <h4 className="plan-name">{tier.name}</h4>
            </div>
            <div className="plan-price">
              <span className="price-amount">
                {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
              </span>
              <span className="price-period">/month</span>
            </div>
            <div className="plan-features">
              <div className="feature-row">
                <FaTruck className="feature-icon" />
                <span><strong>{quotas[tierKey]?.deliveries ?? tier.maxDeliveries}</strong> Deliveries</span>
              </div>
              <div className="feature-row">
                <FaRegBell className="feature-icon" />
                <span><strong>{quotas[tierKey]?.sms ?? tier.maxSms}</strong> SMS</span>
              </div>
              <div className="feature-row">
                <FaUsers className="feature-icon" />
                <span>{quotas[tierKey]?.desc}</span>
              </div>
              {tier.features && tier.features.length > 0 && (
                <div className="feature-row">
                  <FaRegChartBar className="feature-icon" />
                  <span><strong>Features:</strong> {tier.features.join(', ')}</span>
                </div>
              )}
            </div>
            <div className="plan-action">
              {isEnterprise ? (
                <a href="mailto:support@darlogistics.co.zw" className="contact-btn">
                  <FaRegEnvelope className="btn-icon" />
                  Contact Us
                </a>
              ) : (
                <button 
                  onClick={() => handleSelectPlan(tierKey)} 
                  className={`select-btn ${isCurrent ? 'current' : ''}`}
                  disabled={isCurrent || creating}
                >
                  {isCurrent ? 'Current Plan' : creating ? 'Processing...' : 'Select Plan'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAddOns = () => (
    <div className="addons-section">
      <div className="addons-card">
        <div className="addons-header">
          <h5 className="addons-title">Add-Ons & Features</h5>
          <p className="addons-subtitle">Boost your capacity with flexible add-ons</p>
        </div>
        <div className="addons-content">
          <div className="addon-item">
            <div className="addon-info">
              <div className="addon-header">
                <FaTruck className="addon-icon" />
                <div className="addon-details">
                  <h6 className="addon-name">Extra Deliveries</h6>
                  <span className="addon-price">$0.25 per delivery</span>
                </div>
              </div>
              <div className="addon-controls">
                <input 
                  type="number" 
                  min={1} 
                  value={deliveryQty} 
                  onChange={e => setDeliveryQty(Math.max(1, Number(e.target.value)))} 
                  className="quantity-input"
                  disabled={addonLoading} 
                />
                <button 
                  className="paynow-btn"
                  onClick={() => handleAddonPaynow('extra_delivery')} 
                  disabled={addonLoading || deliveryQty < 1}
                >
                  {addonLoading ? 'Processing...' : 'Paynow'}
                </button>
              </div>
            </div>
          </div>
          <div className="addon-item">
            <div className="addon-info">
              <div className="addon-header">
                <FaRegBell className="addon-icon" />
                <div className="addon-details">
                  <h6 className="addon-name">SMS Top-up</h6>
                  <span className="addon-price">$2 / 100 SMS</span>
                </div>
              </div>
              <div className="addon-controls">
                <input 
                  type="number" 
                  min={100} 
                  step={100} 
                  value={smsQty} 
                  onChange={e => setSmsQty(Math.max(100, Math.floor(Number(e.target.value) / 100) * 100))} 
                  className="quantity-input"
                  disabled={addonLoading} 
                />
                <button 
                  className="paynow-btn"
                  onClick={() => handleAddonPaynow('sms_topup')} 
                  disabled={addonLoading || smsQty < 100}
                >
                  {addonLoading ? 'Processing...' : 'Paynow'}
                </button>
              </div>
            </div>
          </div>
          {addonError && <div className="addon-error">{addonError}</div>}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="history-section">
      <h4 className="history-title">Subscription History</h4>
      <div className="history-table">
        <div className="table-header">
          <div className="table-cell">Plan</div>
          <div className="table-cell">Status</div>
          <div className="table-cell">Start</div>
          <div className="table-cell">End</div>
          <div className="table-cell">Deliveries Used</div>
          <div className="table-cell">SMS Used</div>
        </div>
        <div className="table-body">
          {subscriptions.length === 0 ? (
            <div className="no-history">
              <FaRegChartBar className="no-history-icon" />
              <p>No previous subscriptions.</p>
            </div>
          ) : (
            [...subscriptions].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).map(sub => {
              const planConfig = subscriptionTiers[sub.tier] || {};
              return (
                <div key={sub.id || sub.tier} className="table-row">
                  <div className="table-cell">{planConfig.name || sub.tier}</div>
                  <div className="table-cell">
                    <span className={`status-badge ${sub.status}`}>{sub.status}</span>
                  </div>
                  <div className="table-cell">{new Date(sub.startDate).toLocaleDateString()}</div>
                  <div className="table-cell">{new Date(sub.endDate).toLocaleDateString()}</div>
                  <div className="table-cell">{Number(sub.deliveriesUsed) || 0}</div>
                  <div className="table-cell">{Number(sub.smsUsed) || 0}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="subscription-plans-container">
      <div className="plans-header">
        <h1 className="plans-title">Subscription Plans</h1>
        <div className="plans-subtitle">
          All plans include <strong>real-time tracking</strong>, <strong>secure billing</strong>, and <strong>priority support</strong>.
        </div>
      </div>
      
      {error && (
        <div className="error-alert">
          <FaShieldAlt className="alert-icon" />
          <div className="alert-content">
            <p>{error}</p>
            {(error.includes('inactive') || error.includes('expired')) && (
              <button className="alert-btn" onClick={() => setActiveTab('plans')}>
                View Plans & Upgrade
              </button>
            )}
            {error.includes('login') && <a href="/login" className="alert-btn">Login</a>}
          </div>
        </div>
      )}
      
      {createMsg && <div className="info-alert">{createMsg}</div>}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading subscription plans...</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="tabs-container">
            <div className="tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`} 
                onClick={() => setActiveTab('current')}
              >
                <FaRegUser className="tab-icon" />
                Current Plan
              </button>
              <button 
                className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`} 
                onClick={() => setActiveTab('plans')}
              >
                <FaRegListAlt className="tab-icon" />
                Plan Selection
              </button>
              <button 
                className={`tab-btn ${activeTab === 'addons' ? 'active' : ''}`} 
                onClick={() => setActiveTab('addons')}
              >
                <FaRegBell className="tab-icon" />
                Add-Ons
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} 
                onClick={() => setActiveTab('history')}
              >
                <FaRegChartBar className="tab-icon" />
                History
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'current' && renderCurrentPlan()}
            {activeTab === 'plans' && renderPlanSelection()}
            {activeTab === 'addons' && renderAddOns()}
            {activeTab === 'history' && renderHistory()}
          </div>
        </>
      )}

      <style>{`
        /* CSS Custom Properties for Subscription Plans */
        :root {
          --primary-blue: #003366;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --accent-blue: #0066CC;
          --background-gradient: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          --card-background: rgba(255, 255, 255, 0.1);
          --card-border: rgba(255, 255, 255, 0.2);
          --text-primary: #FFFFFF;
          --text-secondary: rgba(255, 255, 255, 0.8);
          --text-muted: rgba(255, 255, 255, 0.6);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --transition-slow: 0.3s ease;
          --border-radius: 16px;
          --border-radius-lg: 20px;
        }

        /* Animated Background */
        .subscription-plans-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: var(--background-gradient);
          z-index: -1;
        }

        /* Floating Elements Animation */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .plan-card {
          animation: float 6s ease-in-out infinite;
        }

        .plan-card:nth-child(2) {
          animation-delay: 1s;
        }

        .plan-card:nth-child(3) {
          animation-delay: 2s;
        }

        .plan-card:nth-child(4) {
          animation-delay: 3s;
        }

        .subscription-plans-container {
          min-height: 100vh;
          background: var(--background-gradient);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 40px 20px;
          color: var(--text-primary);
        }

        .plans-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .plans-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 16px;
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .plans-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Tabs */
        .tabs-container {
          margin-bottom: 40px;
        }

        .tabs-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius);
          padding: 8px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }

        .tab-btn.active {
          background: var(--primary-orange);
          color: var(--text-primary);
        }

        .tab-icon {
          width: 16px;
          height: 16px;
        }

        /* Current Plan Card */
        .current-plan-card {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          padding: 32px;
          margin-bottom: 32px;
        }

        .plan-header {
          margin-bottom: 24px;
        }

        .plan-title-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .plan-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .plan-badge {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .badge-text {
          font-weight: 600;
          color: var(--primary-orange);
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-badge.trial {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        /* Quota Section */
        .quota-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .quota-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
        }

        .quota-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .quota-title {
          font-weight: 600;
          margin: 0;
          font-size: 1rem;
        }

        .quota-usage {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .progress-container {
          width: 100%;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-orange), var(--accent-orange));
          border-radius: 6px;
          transition: width 0.3s ease;
          position: relative;
        }

        .progress-text {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        /* Features Section */
        .features-section {
          margin-bottom: 32px;
        }

        .features-title {
          font-weight: 600;
          margin-bottom: 16px;
          font-size: 1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .feature-icon {
          color: var(--primary-orange);
          width: 16px;
          height: 16px;
        }

        /* Trial Alert */
        .trial-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .alert-icon {
          color: #fbbf24;
          width: 20px;
          height: 20px;
        }

        .alert-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .alert-content strong {
          color: #fbbf24;
        }

        .alert-content span {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        /* Upgrade Section */
        .upgrade-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .upgrade-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .upgrade-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--primary-orange);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .upgrade-btn:hover {
          background: var(--accent-orange);
          transform: translateY(-2px);
        }

        .btn-icon {
          width: 16px;
          height: 16px;
        }

        .upgrade-note {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-top: 8px;
        }

        /* Contact Info */
        .contact-info {
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .contact-icon {
          color: var(--primary-orange);
          width: 16px;
          height: 16px;
        }

        /* No Plan Alert */
        .no-plan-alert {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius);
          padding: 24px;
          text-align: left;
        }

        .no-plan-alert .alert-icon {
          color: var(--primary-orange);
          width: 24px;
          height: 24px;
        }

        .no-plan-alert h5 {
          margin: 0 0 8px 0;
          font-weight: 600;
        }

        .no-plan-alert p {
          margin: 0;
          color: var(--text-secondary);
        }

        /* Error Alert */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--border-radius);
          padding: 20px;
          margin-bottom: 24px;
        }

        .error-alert .alert-icon {
          color: #ef4444;
          width: 20px;
          height: 20px;
        }

        .alert-content {
          flex: 1;
        }

        .alert-content p {
          margin: 0 0 12px 0;
        }

        .alert-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--primary-orange);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .alert-btn:hover {
          background: var(--accent-orange);
        }

        /* Info Alert */
        .info-alert {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--border-radius);
          padding: 16px;
          margin-bottom: 24px;
          color: var(--text-secondary);
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid var(--primary-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Plan Selection Grid */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .plan-card {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          position: relative;
          transition: var(--transition-slow);
        }

        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .plan-card.recommended {
          border: 2px solid var(--primary-orange);
          box-shadow: 0 0 20px rgba(255, 102, 0, 0.2);
        }

        .plan-card.current {
          border: 2px solid var(--accent-blue);
          background: rgba(0, 102, 204, 0.1);
        }

        .recommended-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary-orange);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 2;
        }

        .badge-icon {
          width: 14px;
          height: 14px;
        }

        .plan-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .plan-icon {
          margin-bottom: 12px;
        }

        .plan-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .plan-price {
          text-align: center;
          margin-bottom: 24px;
        }

        .price-amount {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-orange);
        }

        .price-period {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .plan-features {
          margin-bottom: 24px;
        }

        .feature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          color: var(--text-secondary);
        }

        .feature-row .feature-icon {
          color: var(--primary-orange);
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .plan-action {
          text-align: center;
        }

        .select-btn {
          width: 100%;
          background: var(--primary-orange);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .select-btn:hover:not(:disabled) {
          background: var(--accent-orange);
          transform: translateY(-2px);
        }

        .select-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .select-btn.current {
          background: var(--accent-blue);
        }

        .contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          background: var(--primary-blue);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .contact-btn:hover {
          background: var(--accent-blue);
          transform: translateY(-2px);
        }

        /* Add-ons Section */
        .addons-section {
          margin-bottom: 32px;
        }

        .addons-card {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          padding: 32px;
        }

        .addons-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .addons-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .addons-subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .addons-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .addon-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
        }

        .addon-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .addon-header {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 200px;
        }

        .addon-icon {
          color: var(--primary-orange);
          width: 24px;
          height: 24px;
        }

        .addon-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .addon-name {
          font-weight: 600;
          margin: 0;
          font-size: 1rem;
        }

        .addon-price {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .addon-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quantity-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 0.875rem;
          width: 80px;
          text-align: center;
        }

        .quantity-input:focus {
          outline: none;
          border-color: var(--primary-orange);
        }

        .paynow-btn {
          background: var(--primary-orange);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .paynow-btn:hover:not(:disabled) {
          background: var(--accent-orange);
        }

        .paynow-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .addon-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 12px;
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 16px;
        }

        /* History Section */
        .history-section {
          margin-bottom: 32px;
        }

        .history-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 24px;
        }

        .history-table {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          font-weight: 600;
          border-bottom: 1px solid var(--card-border);
        }

        .table-cell {
          padding: 8px;
          text-align: left;
        }

        .table-body {
          max-height: 400px;
          overflow-y: auto;
        }

        .table-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: var(--transition-slow);
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .no-history {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
          color: var(--text-muted);
        }

        .no-history-icon {
          width: 48px;
          height: 48px;
          color: var(--text-muted);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .subscription-plans-container {
            padding: 20px 16px;
          }

          .plans-title {
            font-size: 2rem;
          }

          .tabs-nav {
            flex-direction: column;
            gap: 4px;
          }

          .tab-btn {
            justify-content: center;
            padding: 16px;
          }

          .quota-section {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .contact-info {
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          .plans-grid {
            grid-template-columns: 1fr;
          }

          .addon-info {
            flex-direction: column;
            align-items: stretch;
          }

          .addon-controls {
            justify-content: center;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-cell {
            text-align: center;
            padding: 4px 8px;
          }
        }

        @media (max-width: 480px) {
          .plans-title {
            font-size: 1.75rem;
          }

          .plan-card {
            padding: 20px;
          }

          .addons-card {
            padding: 24px;
          }

          .price-amount {
            font-size: 1.5rem;
          }

          .tabs-nav {
            padding: 4px;
          }

          .tab-btn {
            padding: 12px 16px;
            font-size: 0.875rem;
          }

          .current-plan-card {
            padding: 24px;
          }

          .quota-item {
            padding: 16px;
          }

          .addon-item {
            padding: 16px;
          }

          .quantity-input {
            width: 60px;
            font-size: 0.8rem;
          }

          .paynow-btn {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
        }

        /* Accessibility Improvements */
        .tab-btn:focus,
        .select-btn:focus,
        .contact-btn:focus,
        .paynow-btn:focus,
        .upgrade-btn:focus {
          outline: 2px solid var(--primary-orange);
          outline-offset: 2px;
        }

        .quantity-input:focus {
          outline: 2px solid var(--primary-orange);
          outline-offset: 2px;
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .plan-card {
            animation: none;
          }

          .select-btn:hover,
          .contact-btn:hover,
          .paynow-btn:hover,
          .upgrade-btn:hover {
            transform: none;
          }

          .plan-card:hover {
            transform: none;
          }
        }

        /* High Contrast Mode Support */
        @media (prefers-contrast: high) {
          .plan-card {
            border: 2px solid var(--text-primary);
          }

          .progress-fill {
            background: var(--text-primary);
          }

          .status-badge {
            border: 1px solid var(--text-primary);
          }
        }
      `}</style>
    </div>
  );
} 