import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error
      if (error.response.status === 401 || error.response.status === 403) {
        // Handle auth errors globally
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Data transformation utilities
export const toCamel = d => ({
  trackingId: d.tracking_id,
  customerName: d.customer_name,
  phoneNumber: d.phone_number,
  currentStatus: d.current_status,
  checkpoints: d.checkpoints,
  driverDetails: d.driver_details,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
});

export const toSnake = d => ({
  tracking_id: d.trackingId,
  customer_name: d.customerName,
  phone_number: d.phoneNumber,
  current_status: d.currentStatus,
  checkpoints: d.checkpoints || [],
  driver_details: d.driverDetails || { name: '', vehicleReg: '' }
});

// API endpoints
export const deliveryApi = {
  // Get all deliveries
  getAll: async () => {
    const res = await api.get('/deliveries');
    return Array.isArray(res.data) ? res.data.map(toCamel) : [];
  },

  // Get delivery by tracking ID
  getById: async (trackingId) => {
    const res = await api.get(`/deliveries/${trackingId}`);
    return toCamel(res.data);
  },

  // Create new delivery
  create: async (delivery) => {
    console.log('Sending delivery data:', delivery); // Debug log
    const snakeData = toSnake(delivery);
    console.log('Transformed data:', snakeData); // Debug log
    const res = await api.post('/deliveries', snakeData);
    return res.data;
  },

  // Update checkpoint
  updateCheckpoint: async (trackingId, checkpoint, currentStatus) => {
    const res = await api.post('/updateCheckpoint', {
      trackingId,
      checkpoint,
      currentStatus
    });
    return res.data;
  },

  // Send initial SMS
  sendInitialSms: async (to, message) => {
    const res = await api.post('/send-initial-sms', { to, message });
    return res.data;
  }
};

export const authApi = {
  login: async (username, password) => {
    const res = await api.post('/login', { username, password });
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/logout');
    return res.data;
  }
};

export default api; 