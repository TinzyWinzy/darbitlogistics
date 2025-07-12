-- Migration: Add notifications table for user/system notifications
-- Supports linking to users, deliveries, bookings, etc.

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- nullable for global/system notifications
  type VARCHAR(16) NOT NULL DEFAULT 'info', -- info, warning, error
  message TEXT NOT NULL,
  entity_type VARCHAR(32), -- e.g., 'delivery', 'booking'
  entity_id TEXT,          -- e.g., tracking_id or booking_id
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by user and unread status
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read); 