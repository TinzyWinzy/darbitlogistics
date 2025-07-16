import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BillingDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/plans', { replace: true });
  }, [navigate]);

  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [error, setError] = useState(null);

  const handleUpgrade = async (planId) => {
    setLoadingPlanId(planId);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planId }), // PATCH: use 'tier' not 'planId'
      });
      const data = await res.json();
      if (data.paymentUrl || data.paynowUrl) {
        window.location.href = data.paymentUrl || data.paynowUrl;
      } else {
        setError('Payment initiation failed.');
      }
    } catch (e) {
      setError('Payment initiation failed.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  return null;
} 