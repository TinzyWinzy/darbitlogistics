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
  createdByUserId: d.created_by_user_id
});

export const parentBookingToCamel = d => ({
  id: d.parent_booking_id,
  customerName: d.customer_name,
  phoneNumber: d.phone_number,
  totalTonnage: d.total_tonnage,
  mineral_type: d.mineral_type,
  mineral_grade: d.mineral_grade,
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
  sampling_status: d.samplingStatus
});

// API endpoints
export const deliveryApi = {
  // Get all deliveries
  getAll: async () => {
    try {
      const res = await api.get('/deliveries');
      return Array.isArray(res.data) ? res.data.map(toCamel) : [];
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      throw error;
    }
  },

  // Get delivery by tracking ID
  getById: async (trackingId) => {
    try {
      const res = await api.get(`/deliveries/${trackingId}`);
      return toCamel(res.data);
    } catch (error) {
      console.error(`Failed to fetch delivery ${trackingId}:`, error);
      throw error;
    }
  },

  // Create new delivery
  create: async (deliveryData) => {
    try {
      console.log('Sending delivery data to API:', deliveryData);
      const res = await api.post('/deliveries', deliveryData);
      return res.data;
    } catch (error) {
      console.error('Failed to create delivery:', error);
      throw error;
    }
  },

  // Update a delivery's checkpoints and status
  updateCheckpoint: async (trackingId, data) => {
    try {
      const payload = {
        trackingId,
        checkpoints: data.checkpoints,
        currentStatus: data.currentStatus,
      };
      const res = await api.post('/updateCheckpoint', payload);
      return res.data;
    } catch (error) {
      console.error(`Failed to update checkpoint for ${trackingId}:`, error);
      throw error;
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
      return res.data;
    } catch (error) {
      console.error(`Failed to fetch parent booking ${id}:`, error);
      throw error;
    }
  },

  async getDeliveriesByParentId(parentId) {
    try {
      const res = await api.get(`/parent-bookings/${parentId}/deliveries`);
      return res.data;
    } catch (error) {
      console.error(`Failed to fetch deliveries for parent booking ${parentId}:`, error);
      throw error;
    }
  },

  async createParentBooking(bookingData) {
    try {
      console.log('Sending parent booking data to API:', bookingData);
      const res = await api.post('/parent-bookings', bookingData);
      return res.data;
    } catch (error) {
      console.error('Failed to create parent booking:', error);
      throw error;
    }
  },

  async getAllParentBookings(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await api.get(`/parent-bookings?${queryParams}`);
      return Array.isArray(res.data) ? res.data.map(parentBookingToCamel) : [];
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
  admin: {
    getAllUsers: async () => {
      try {
        const res = await api.get('/admin/users');
        return res.data;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }
    },

    createUser: async (userData) => {
      try {
        const res = await api.post('/admin/users', userData);
        return res.data;
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    },

    deleteUser: async (userId) => {
      try {
        const res = await api.delete(`/admin/users/${userId}`);
        return res.data;
      } catch (error) {
        console.error(`Failed to delete user ${userId}:`, error);
        throw error;
      }
    }
  }
};

export default api; 