import { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from './api';

export function useParentBookings() {
  const [parentBookings, setParentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParentBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryApi.getAllParentBookings();
      setParentBookings(data);
    } catch (err) {
      console.error('Failed to fetch parent bookings:', err);
      setError(err.response?.data?.error || 'Failed to fetch parent bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParentBookings();
  }, [fetchParentBookings]);

  const createParentBooking = useCallback(async (bookingData) => {
    try {
      const res = await deliveryApi.createParentBooking(bookingData);
      await fetchParentBookings(); // Refresh list after creation
      return res;
    } catch (err) {
      console.error('Create parent booking error:', err);
      throw err;
    }
  }, [fetchParentBookings]);

  return {
    parentBookings,
    loading,
    error,
    fetchParentBookings,
    createParentBooking,
  };
} 