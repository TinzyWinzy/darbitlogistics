import { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from './api';

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchDeliveries = useCallback(async (pageArg = page, pageSizeArg = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const offset = (pageArg - 1) * pageSizeArg;
      const { deliveries: data, total: totalCount } = await deliveryApi.getAll(pageSizeArg, offset);
      setDeliveries(data);
      setTotal(totalCount);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch deliveries');
      setDeliveries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchDeliveries(page, pageSize);
  }, [fetchDeliveries, page, pageSize]);

  const createDelivery = useCallback(async (deliveryData) => {
    try {
      const res = await deliveryApi.create(deliveryData);
      await fetchDeliveries(page, pageSize); // Refresh list
      return res;
    } catch (err) {
      console.error('Create delivery error:', err);
      throw err;
    }
  }, [fetchDeliveries, page, pageSize]);

  const updateCheckpoint = useCallback(async (trackingId, checkpoints, status) => {
    try {
      await deliveryApi.updateCheckpoint(trackingId, checkpoints, status);
      await fetchDeliveries(page, pageSize); // Refresh list
    } catch (err) {
      console.error('Update checkpoint error:', err);
      throw err;
    }
  }, [fetchDeliveries, page, pageSize]);

  return {
    deliveries,
    loading,
    error,
    fetchDeliveries,
    createDelivery,
    updateCheckpoint,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
  };
} 