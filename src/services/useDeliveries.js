import { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from './api';

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryApi.getAll();
      setDeliveries(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch deliveries');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const createDelivery = useCallback(async (deliveryData) => {
    try {
      const res = await deliveryApi.create(deliveryData);
      await fetchDeliveries(); // Refresh list
      return res;
    } catch (err) {
      console.error('Create delivery error:', err);
      throw err;
    }
  }, [fetchDeliveries]);

  const updateCheckpoint = useCallback(async (trackingId, checkpoints, status) => {
    try {
      await deliveryApi.updateCheckpoint(trackingId, checkpoints, status);
      await fetchDeliveries(); // Refresh list
    } catch (err) {
      console.error('Update checkpoint error:', err);
      throw err;
    }
  }, [fetchDeliveries]);

  return {
    deliveries,
    loading,
    error,
    fetchDeliveries,
    createDelivery,
    updateCheckpoint,
  };
} 