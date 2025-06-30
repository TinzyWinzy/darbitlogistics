-- Migration: Add refresh_tokens table for JWT refresh token support
CREATE TABLE IF NOT EXISTS refresh_tokens (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL
); 