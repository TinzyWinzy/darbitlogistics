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
    console.log('Sending delivery data:', delivery);
    const snakeData = toSnake(delivery);
    console.log('Transformed data:', snakeData);
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
  },

  async getParentBooking(id) {
    const response = await fetch(`${API_URL}/parent-bookings/${id}`);
    if (!response.ok) throw new Error('Failed to fetch parent booking');
    return response.json();
  },

  async getDeliveriesByParentId(parentId) {
    const response = await fetch(`${API_URL}/parent-bookings/${parentId}/deliveries`);
    if (!response.ok) throw new Error('Failed to fetch deliveries');
    return response.json();
  },

  async getMilestoneNotifications(parentId) {
    const response = await fetch(`${API_URL}/parent-bookings/${parentId}/notifications`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async createParentBooking(data) {
    const response = await fetch(`${API_URL}/parent-bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create parent booking');
    return response.json();
  },

  async updateMilestoneNotifications(parentId, milestoneData) {
    const response = await fetch(`${API_URL}/parent-bookings/${parentId}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(milestoneData),
    });
    if (!response.ok) throw new Error('Failed to update milestone notifications');
    return response.json();
  },

  async getAllParentBookings(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/parent-bookings?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch parent bookings');
    return response.json();
  },
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