import { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from './api';

export function useParentBookings() {
  const [parentBookings, setParentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchParentBookings = useCallback(async (pageArg = page, pageSizeArg = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const offset = (pageArg - 1) * pageSizeArg;
      const { parentBookings: data, total: totalCount } = await deliveryApi.getAllParentBookings({}, pageSizeArg, offset);
      setParentBookings(data);
      setTotal(totalCount);
    } catch (err) {
      console.error('Failed to fetch parent bookings:', err);
      setError(err.response?.data?.error || 'Failed to fetch parent bookings');
      setParentBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchParentBookings(page, pageSize);
  }, [fetchParentBookings, page, pageSize]);

  const createParentBooking = useCallback(async (bookingData) => {
    try {
      const res = await deliveryApi.createParentBooking(bookingData);
      await fetchParentBookings(page, pageSize); // Refresh list after creation
      return res;
    } catch (err) {
      console.error('Create parent booking error:', err);
      throw err;
    }
  }, [fetchParentBookings, page, pageSize]);

  return {
    parentBookings,
    loading,
    error,
    fetchParentBookings,
    createParentBooking,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
  };
} 