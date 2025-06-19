import { useState } from 'react';
import { deliveryApi } from '../services/api';

// Spinner component
function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-4">
      <div className="spinner-border" style={{ color: '#D2691E' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function TrackDelivery() {
  const [trackingId, setTrackingId] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    setError('');
    setDelivery(null);

    try {
      const data = await deliveryApi.getById(trackingId);
      setDelivery(data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to find delivery');
      setDelivery(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Track Your Delivery</h1>
          <p className="mt-2 text-gray-600">Enter your tracking ID to see delivery status and updates</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              placeholder="Enter tracking ID (e.g., ABC1234)"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              maxLength="7"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-8">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {delivery && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="border-b pb-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Delivery Details</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tracking ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.trackingId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Customer</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.customerName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Current Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{delivery.currentStatus}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(delivery.createdAt)}</dd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Checkpoints</h3>
                <div className="mt-4 flow-root">
                  <ul className="-mb-8">
                    {delivery.checkpoints.map((checkpoint, idx) => (
                      <li key={checkpoint.timestamp}>
                        <div className="relative pb-8">
                          {idx !== delivery.checkpoints.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                                <span className="text-white text-sm">{idx + 1}</span>
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {checkpoint.location} - {checkpoint.comment}
                                </p>
                                <p className="text-sm text-gray-500">By {checkpoint.operator}</p>
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                {formatDate(checkpoint.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 