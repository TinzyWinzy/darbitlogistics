import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { deliveryApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Helper function to calculate remaining days
const getRemainingDays = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = Math.max(end - today, 0);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// A simple loading spinner
function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border" style={{ color: '#D2691E' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function BillingDashboard() {
  const { user } = useContext(AuthContext);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSubscription = async () => {
      try {
        const subData = await deliveryApi.getMySubscription();
        setSubscription(subData);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch subscription details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, navigate]);

  const handleRequestUpgrade = () => {
    // For MVP, this can be a mailto link or a trigger to a contact form/modal.
    window.location.href = 'mailto:sales@morreslogistics.com?subject=Subscription Upgrade Request';
  };
  
  const deliveryQuotaPercentage = subscription 
    ? (subscription.deliveries_used / subscription.tierDetails.maxDeliveries) * 100
    : 0;

  const smsQuotaPercentage = subscription 
    ? (subscription.sms_used / subscription.tierDetails.maxSms) * 100
    : 0;
  
  const remainingDays = subscription ? getRemainingDays(subscription.end_date) : null;

  if (loading) return <Spinner />;

  return (
    <div className="container py-5">
      {/* Strategic Operations Console Banner */}
      <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
        STRATEGIC OPERATIONS CONSOLE
      </div>
      <h1 className="display-6 fw-bold mb-4" style={{ color: '#1F2120' }}>Billing & Subscription</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {!subscription && !error && (
        <div className="alert alert-warning">
          You do not have an active subscription. Please contact support.
        </div>
      )}
      
      {subscription && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <h2 className="h5 mb-0 fw-bold" style={{ color: '#1F2120' }}>Your Current Plan</h2>
            <span className={`badge bg-${subscription.status === 'active' ? 'success' : 'warning'} text-uppercase`}>
              {subscription.tierDetails.name} Plan ({subscription.status})
            </span>
          </div>
          <div className="card-body">
            {subscription.status === 'trial' && remainingDays !== null && (
              <div className="alert alert-info">
                <strong>Your trial expires in {remainingDays} day{remainingDays !== 1 && 's'}.</strong>
              </div>
            )}
            
            <div className="row g-4 mb-4">
              {/* Delivery Quota */}
              <div className="col-md-6">
                <div className="mb-3">
                  <h6 className="fw-bold">Deliveries Quota</h6>
                  <p className="text-muted mb-1">
                    {subscription.deliveries_used} / {subscription.tierDetails.maxDeliveries === Infinity ? 'Unlimited' : subscription.tierDetails.maxDeliveries} used
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

              {/* SMS Quota */}
              <div className="col-md-6">
                <div className="mb-3">
                  <h6 className="fw-bold">SMS Quota</h6>
                  <p className="text-muted mb-1">
                    {subscription.sms_used} / {subscription.tierDetails.maxSms === Infinity ? 'Unlimited' : subscription.tierDetails.maxSms} used
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
            {/* Internal Contact Info */}
            <div className="alert alert-secondary text-center small mb-0" style={{ background: '#fffbe6', color: '#1F2120' }}>
              <strong>Contact Finance:</strong> info@morres.com | +263 242 303 123
            </div>
            <div className="text-center text-muted mt-2 small">
              For internal operations. Not for public distribution.
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 