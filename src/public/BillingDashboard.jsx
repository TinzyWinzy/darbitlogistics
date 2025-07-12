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

  return null;
} 