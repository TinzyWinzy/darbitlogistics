-- Phase 1: Subscription and Billing Schema
-- This script adds the necessary tables to support a tiered subscription model.
-- It assumes the existence of a `users` table with an `id` primary key.

-- Create ENUM types for subscription tiers and statuses
-- This provides type safety at the database level.
CREATE TYPE subscription_tier AS ENUM ('starter', 'basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'expired', 'canceled');

-- Table: subscriptions
-- Stores user subscription information, including usage quotas.
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL,
    status subscription_status NOT NULL DEFAULT 'trial',
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    payment_method TEXT,
    deliveries_used INTEGER NOT NULL DEFAULT 0,
    sms_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: invoices
-- Stores billing history for each user.
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    paid BOOLEAN NOT NULL DEFAULT false,
    payment_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- Add a trigger to update the updated_at timestamp on subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a unique constraint to ensure a user has only one active/trial subscription
-- Note: A user could have multiple expired or canceled subscriptions in their history.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription_per_user
ON subscriptions(user_id)
WHERE status IN ('active', 'trial');

COMMENT ON TABLE subscriptions IS 'Manages user subscription tiers, quotas, and status.';
COMMENT ON COLUMN subscriptions.user_id IS 'Foreign key to the users table.';
COMMENT ON COLUMN subscriptions.end_date IS 'The date when the current subscription period ends. Null for enterprise or lifetime plans.';
COMMENT ON COLUMN subscriptions.deliveries_used IS 'Counter for deliveries made in the current billing cycle.';
COMMENT ON COLUMN subscriptions.sms_used IS 'Counter for SMS messages sent in the current billing cycle.';

COMMENT ON TABLE invoices IS 'Records all payment transactions and billing events.';
COMMENT ON COLUMN invoices.subscription_id IS 'The specific subscription this invoice is for.';
COMMENT ON COLUMN invoices.amount IS 'The amount due for the invoice.';

COMMIT; 