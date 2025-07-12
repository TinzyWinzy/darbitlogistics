import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BillingDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/plans', { replace: true });
  }, [navigate]);
  return null;
} 