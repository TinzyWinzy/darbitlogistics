// Dexie.js setup for offline-first logistics app
import Dexie from 'dexie';

const db = new Dexie('DarLogisticsDB');

db.version(2).stores({
  deliveries: 'trackingId, parentBookingId, customerName, currentStatus, destination, isCompleted, updatedAt',
  checkpoints: '++id, deliveryTrackingId, operatorId, status, timestamp',
  users: 'id, username, role',
  parentBookings: 'id, customerName, status, deadline',
  outbox: '++id, type, entity, payload, createdAt', // type: 'createDelivery', 'updateCheckpoint', etc.
});

export default db; 