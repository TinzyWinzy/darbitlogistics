import axios from 'axios';
import { normalizeKeys } from './normalizeKeys';
import db from './db';

function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

// Response interceptor for error handling
api.interceptors.response.use(
  response => {
    // Normalize all response data to camelCase
    if (response && response.data) {
      response.data = normalizeKeys(response.data);
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await api.post('/api/auth/refresh');
          const newToken = res.data.token;
          localStorage.setItem('jwt_token', newToken);
          onRefreshed(newToken);
          isRefreshing = false;
        } catch (refreshError) {
          isRefreshing = false;
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
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
  driverDetails: d.driver_details || { name: '', vehicleReg: '' },
  createdAt: d.created_at,
  updatedAt: d.updated_at,
  bookingReference: d.booking_reference,
  loadingPoint: d.loading_point,
  destination: d.destination,
  vehicleType: d.vehicle_type,
  vehicleCapacity: d.vehicle_capacity,
  tonnage: d.tonnage,
  containerCount: d.container_count,
  parentBookingId: d.parent_booking_id,
  isCompleted: d.is_completed,
  completionDate: d.completion_date,
  hasWeighbridgeCert: d.has_weighbridge_cert,
  weighbridgeRef: d.weighbridge_ref,
  tareWeight: d.tare_weight,
  netWeight: d.net_weight,
  samplingRequired: d.sampling_required,
  samplingStatus: d.sampling_status,
  environmentalIncident: d.environmental_incident,
  incidentDetails: d.incident_details,
  mineralType: d.mineral_type,
  mineralGrade: d.mineral_grade,
  moistureContent: d.moisture_content,
  particleSize: d.particle_size,
  requiresAnalysis: d.requires_analysis,
  analysisCertificate: d.analysis_certificate,
  specialHandlingNotes: d.special_handling_notes,
  environmentalConcerns: d.environmental_concerns,
  notes: d.notes,
  status: d.status,
  remainingTonnage: d.remaining_tonnage,
  completedTonnage: d.completed_tonnage,
  createdByUserId: d.created_by_user_id,
  value: d.value,
  cost: d.cost,
  customStatus: d.custom_status,
});

export const parentBookingToCamel = d => ({
  id: d.id || d.parent_booking_id,
  customerName: d.customer_name,
  phoneNumber: d.phone_number,
  totalTonnage: d.total_tonnage,
  mineralType: d.mineral_type,
  mineralGrade: d.mineral_grade,
  loadingPoint: d.loading_point,
  destination: d.destination,
  deadline: d.deadline,
  bookingCode: d.booking_code,
  status: d.status,
  remainingTonnage: d.remaining_tonnage,
  completionPercentage: d.completion_percentage,
  completedTonnage: d.completed_tonnage,
  totalDeliveries: d.total_deliveries,
  completedDeliveries: d.completed_deliveries,
  notes: d.notes,
  deliveries: Array.isArray(d.deliveries) ? d.deliveries.map(toCamel) : [],
});

export const toSnake = d => ({
  customer_name: d.customerName,
  phone_number: d.phoneNumber,
  current_status: d.currentStatus,
  parent_booking_id: d.parentBookingId,
  tonnage: d.tonnage,
  container_count: d.containerCount,
  vehicle_type: d.vehicleType || 'Standard Truck',
  vehicle_capacity: d.vehicleCapacity || 30.00,
  loading_point: d.loadingPoint,
  destination: d.destination,
  checkpoints: d.checkpoints || [],
  driver_details: d.driverDetails || { name: '', vehicleReg: '' },
  mineral_type: d.mineralType || 'Other',
  mineral_grade: d.mineralGrade || 'Ungraded',
  moisture_content: d.moistureContent,
  particle_size: d.particleSize,
  requires_analysis: d.requiresAnalysis || false,
  analysis_certificate: d.analysisCertificate,
  special_handling_notes: d.specialHandlingNotes,
  environmental_concerns: d.environmentalConcerns,
  notes: d.notes,
  status: d.status || 'Active',
  remaining_tonnage: d.remainingTonnage,
  completed_tonnage: d.completedTonnage || 0,
  environmental_incident: d.environmentalIncident || false,
  incident_details: d.incidentDetails || {},
  sampling_required: d.samplingRequired || false,
  sampling_status: d.samplingStatus,
  value: d.value,
  cost: d.cost,
  custom_status: d.customStatus,
});

// API endpoints
export const deliveryApi = {
  // Get all deliveries (offline-first)
  getAll: async (limit = 20, offset = 0, search = '') => {
    if (!isOnline()) {
      // Offline: query IndexedDB
      let deliveries = await db.deliveries.toArray();
      if (search) {
        deliveries = deliveries.filter(d =>
          d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          d.trackingId?.toLowerCase().includes(search.toLowerCase())
        );
      }
      return { deliveries: deliveries.slice(offset, offset + limit), total: deliveries.length };
    }
    // Online: fetch from API, update IndexedDB
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(search ? { search } : {})
      });
      const res = await api.get(`/deliveries?${params.toString()}`);
      const data = normalizeKeys(res.data);
      // Update IndexedDB
      if (Array.isArray(data.deliveries)) {
        await db.deliveries.bulkPut(data.deliveries);
      }
      return { deliveries: data.deliveries, total: data.total };
    } catch (error) {
      // Fallback to IndexedDB if API fails
      let deliveries = await db.deliveries.toArray();
      if (search) {
        deliveries = deliveries.filter(d =>
          d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          d.trackingId?.toLowerCase().includes(search.toLowerCase())
        );
      }
      return { deliveries: deliveries.slice(offset, offset + limit), total: deliveries.length };
    }
  },

  // Get delivery by tracking ID (offline-first)
  getById: async (trackingId) => {
    if (!isOnline()) {
      // Offline: query IndexedDB
      return await db.deliveries.get(trackingId);
    }
    try {
      const res = await api.get(`/deliveries/${trackingId}`);
      const delivery = normalizeKeys(res.data);
      if (delivery) {
        await db.deliveries.put(delivery);
      }
      return delivery;
    } catch (error) {
      // Fallback to IndexedDB if API fails
      return await db.deliveries.get(trackingId);
    }
  },

  // Create new delivery (offline-capable)
  create: async (deliveryData) => {
    if (!isOnline()) {
      // Queue in outbox and update local DB
      const now = new Date().toISOString();
      await db.outbox.add({
        type: 'createDelivery',
        entity: 'delivery',
        payload: deliveryData,
        createdAt: now,
      });
      // Generate a temporary trackingId if not present
      const tempId = deliveryData.trackingId || `offline-${Date.now()}`;
      await db.deliveries.put({ ...deliveryData, trackingId: tempId, updatedAt: now });
      return { ...deliveryData, trackingId: tempId, offline: true };
    }
    try {
      const res = await api.post('/deliveries', deliveryData);
      const delivery = normalizeKeys(res.data);
      if (delivery) {
        await db.deliveries.put(delivery);
      }
      return delivery;
    } catch (error) {
      // If API fails, fallback to outbox
      const now = new Date().toISOString();
      await db.outbox.add({
        type: 'createDelivery',
        entity: 'delivery',
        payload: deliveryData,
        createdAt: now,
      });
      const tempId = deliveryData.trackingId || `offline-${Date.now()}`;
      await db.deliveries.put({ ...deliveryData, trackingId: tempId, updatedAt: now });
      return { ...deliveryData, trackingId: tempId, offline: true };
    }
  },

  // Update a delivery's checkpoints and status (offline-capable)
  updateCheckpoint: async (trackingId, data) => {
    if (!isOnline()) {
      const now = new Date().toISOString();
      await db.outbox.add({
        type: 'updateCheckpoint',
        entity: 'delivery',
        payload: { trackingId, ...data },
        createdAt: now,
      });
      // Update local delivery
      const delivery = await db.deliveries.get(trackingId);
      if (delivery) {
        await db.deliveries.put({
          ...delivery,
          checkpoints: data.checkpoints,
          currentStatus: data.currentStatus,
          updatedAt: now,
        });
      }
      return { trackingId, ...data, offline: true };
    }
    try {
      const payload = {
        trackingId,
        checkpoints: data.checkpoints,
        currentStatus: data.currentStatus,
      };
      const res = await api.post('/updateCheckpoint', payload);
      const updated = normalizeKeys(res.data);
      if (updated) {
        await db.deliveries.put(updated);
      }
      return updated;
    } catch (error) {
      // If API fails, fallback to outbox
      const now = new Date().toISOString();
      await db.outbox.add({
        type: 'updateCheckpoint',
        entity: 'delivery',
        payload: { trackingId, ...data },
        createdAt: now,
      });
      const delivery = await db.deliveries.get(trackingId);
      if (delivery) {
        await db.deliveries.put({
          ...delivery,
          checkpoints: data.checkpoints,
          currentStatus: data.currentStatus,
          updatedAt: now,
        });
      }
      return { trackingId, ...data, offline: true };
    }
  },

  // Get VAPID public key
  getVapidPublicKey: async () => {
    try {
      const res = await api.get('/vapidPublicKey');
      return res.data;
    } catch (error) {
      console.error('Failed to fetch VAPID public key:', error);
      throw error;
    }
  },

  // Subscribe to push notifications
  subscribe: async (subscription) => {
    try {
      const res = await api.post('/subscribe', subscription);
      return res.data;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  },

  // Send initial SMS
  sendInitialSms: async (to, message) => {
    try {
      const res = await api.post('/send-initial-sms', { to, message });
      return res.data;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  },

  // Parent Booking Methods
  async getParentBooking(id) {
    try {
      const res = await api.get(`/parent-bookings/${id}`);
      return normalizeKeys(res.data);
    } catch (error) {
      console.error(`Failed to fetch parent booking ${id}:`, error);
      throw error;
    }
  },

  async getDeliveriesByParentId(parentId) {
    try {
      const res = await api.get(`/parent-bookings/${parentId}/deliveries`);
      return normalizeKeys(res.data);
    } catch (error) {
      console.error(`Failed to fetch deliveries for parent booking ${parentId}:`, error);
      throw error;
    }
  },

  async createParentBooking(bookingData) {
    try {
      const res = await api.post('/parent-bookings', bookingData);
      return normalizeKeys(res.data);
    } catch (error) {
      console.error('Failed to create parent booking:', error);
      throw error;
    }
  },

  async getAllParentBookings({ search = '', progressFilter = 'all', progressSort = 'deadline', progressSortOrder = 'asc' } = {}, pageSize = 20, offset = 0) {
    try {
      const page = Math.floor(offset / pageSize) + 1;
      const queryParams = new URLSearchParams({
        search,
        progressFilter,
        progressSort,
        progressSortOrder,
        page,
        pageSize
      }).toString();
      const res = await api.get(`/parent-bookings?${queryParams}`);
      const data = normalizeKeys(res.data);
      return {
        parentBookings: data.parentBookings,
        total: data.total
      };
    } catch (error) {
      console.error('Failed to fetch parent bookings:', error);
      throw error;
    }
  },

  // Update parent booking status
  async updateParentBookingStatus(id, status) {
    try {
      const res = await api.patch(`/parent-bookings/${id}/status`, { status });
      return res.data;
    } catch (error) {
      console.error(`Failed to update parent booking ${id} status:`, error);
      throw error;
    }
  },

  // Get booking progress
  async getBookingProgress(id) {
    try {
      const res = await api.get(`/parent-bookings/${id}/progress`);
      return res.data;
    } catch (error) {
      console.error(`Failed to fetch progress for booking ${id}:`, error);
      throw error;
    }
  },

  // Subscription APIs
  async getMySubscription() {
    const res = await api.get('/api/subscriptions/me');
    return res.data;
  },

  async getAllSubscriptions() {
    const res = await api.get('/api/admin/subscriptions');
    return res.data;
  },

  async updateUserSubscription(subId, data) {
    const res = await api.patch(`/api/admin/subscriptions/${subId}`, data);
    return res.data;
  },

  async createSubscription({ tier }) {
    const res = await api.post('/api/subscriptions', { tier });
    return res.data;
  },

  async getMyAllSubscriptions() {
    const res = await api.get('/api/subscriptions/all');
    return res.data;
  },

  admin: {
    getAllUsers: async () => {
      try {
        const res = await api.get('/api/admin/users');
        return res.data;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }
    },
    createUser: async (userData) => {
      try {
        const res = await api.post('/api/admin/users', userData);
        return res.data;
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    },
    deleteUser: async (userId) => {
      try {
        const res = await api.delete(`/api/admin/users/${userId}`);
        return res.data;
      } catch (error) {
        console.error(`Failed to delete user ${userId}:`, error);
        throw error;
      }
    },
    getLogs: async () => {
      try {
        const res = await api.get('/api/admin/logs');
        return res.data;
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        throw error;
      }
    }
  },
  // Get analytics for dashboard
  getAnalytics: async () => {
    try {
      const res = await api.get('/deliveries/analytics');
      // Defensive normalization
      const data = normalizeKeys(res.data);
      return data.analytics;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  },
  createAddonPurchase: async ({ type, quantity }) => {
    if (type === 'extra_delivery') {
      const res = await api.post('/api/addons/purchase-deliveries', { quantity: quantity || 1 });
      return res.data;
    }
    if (type === 'sms_topup') {
      const res = await api.post('/api/addons/purchase-sms', { quantity: quantity || 100 });
      return res.data;
    }
    throw new Error('Invalid add-on type');
  }
};

export const notificationApi = {
  // Fetch notifications for current user
  async getNotifications() {
    const res = await api.get('/api/notifications');
    return res.data.notifications;
  },
  // Mark notification as read
  async markNotificationRead(id) {
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data.notification;
  },
  // Create a notification (admin only)
  async createNotification({ userId, type = 'info', message, entityType, entityId }) {
    const res = await api.post('/api/notifications', {
      user_id: userId,
      type,
      message,
      entity_type: entityType,
      entity_id: entityId
    });
    return res.data.notification;
  }
};

export const invoiceApi = {
  // Fetch invoice history for current user
  async getInvoices() {
    const res = await api.get('/api/invoices');
    return res.data.invoices;
  },
  // Download invoice (returns JSON for now)
  async downloadInvoice(invoiceId) {
    const res = await api.get(`/api/invoices/${invoiceId}/download`, { responseType: 'blob' });
    return res.data;
  }
};

export const scheduledReportApi = {
  create: async (config) => {
    const res = await api.post('/api/reports/schedule', config);
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/api/reports/schedule');
    return res.data;
  },
  update: async (id, config) => {
    const res = await api.put(`/api/reports/schedule/${id}`, config);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/reports/schedule/${id}`);
    return res.data;
  }
};

// Background sync worker for outbox
export async function processOutbox() {
  if (!isOnline()) return;
  const outboxItems = await db.outbox.orderBy('createdAt').toArray();
  for (const item of outboxItems) {
    try {
      if (item.type === 'createDelivery') {
        const res = await api.post('/deliveries', item.payload);
        const delivery = normalizeKeys(res.data);
        if (delivery) {
          await db.deliveries.put(delivery);
        }
      } else if (item.type === 'updateCheckpoint') {
        const payload = {
          trackingId: item.payload.trackingId,
          checkpoints: item.payload.checkpoints,
          currentStatus: item.payload.currentStatus,
        };
        const res = await api.post('/updateCheckpoint', payload);
        const updated = normalizeKeys(res.data);
        if (updated) {
          await db.deliveries.put(updated);
        }
      }
      // Remove item from outbox if successful
      await db.outbox.delete(item.id);
    } catch (err) {
      // Stop processing on first failure to avoid rapid retries
      break;
    }
  }
}

// Request interceptor to attach JWT token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default api; 