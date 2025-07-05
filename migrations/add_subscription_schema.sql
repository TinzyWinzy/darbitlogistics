-- Robust, idempotent migration for subscriptions/invoices schema
-- Ensures types, tables, columns, indexes, triggers exist and upgrades SERIAL PK to UUID if needed
-- Safe for production, preserves all data

-- 1. Create ENUM types if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('starter', 'basic', 'pro', 'enterprise');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'expired', 'canceled');
  END IF;
END $$;

-- 2. Create subscriptions table if missing (uuid PK)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    CREATE TABLE subscriptions (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tier subscription_tier NOT NULL DEFAULT 'starter',
      status subscription_status NOT NULL DEFAULT 'trial',
      start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMPTZ,
      payment_method TEXT,
      deliveries_used INTEGER NOT NULL DEFAULT 0,
      sms_used INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- 3. If table exists but id is SERIAL, migrate to uuid PK (preserve data)
DO $$
DECLARE
  coltype TEXT;
BEGIN
  SELECT data_type INTO coltype FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='id';
  IF coltype IS NOT NULL AND coltype <> 'uuid' THEN
    -- Add new uuid column if not present
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='id_new') THEN
      ALTER TABLE subscriptions ADD COLUMN id_new uuid DEFAULT uuid_generate_v4();
    END IF;
    -- Fill new uuid column
    UPDATE subscriptions SET id_new = uuid_generate_v4() WHERE id_new IS NULL;
    -- Drop old PK constraint
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
    -- Set new uuid column as PK
    ALTER TABLE subscriptions ALTER COLUMN id_new SET NOT NULL;
    ALTER TABLE subscriptions ADD PRIMARY KEY (id_new);
    -- Rename columns
    ALTER TABLE subscriptions RENAME COLUMN id TO id_old;
    ALTER TABLE subscriptions RENAME COLUMN id_new TO id;
    -- (Optional) Update FKs in referencing tables (manual step if needed)
    -- Keep old id column for reference
  END IF;
END $$;

-- 4. Add missing columns (if any)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='deliveries_used') THEN
    ALTER TABLE subscriptions ADD COLUMN deliveries_used INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='sms_used') THEN
    ALTER TABLE subscriptions ADD COLUMN sms_used INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='payment_method') THEN
    ALTER TABLE subscriptions ADD COLUMN payment_method TEXT;
  END IF;
END $$;

-- 5. Create or replace the updated_at trigger function (outside DO block)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Add trigger for updated_at if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 7. Add indexes if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_subscriptions_user_id') THEN
    CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_subscriptions_status') THEN
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'unique_active_subscription_per_user') THEN
    CREATE UNIQUE INDEX unique_active_subscription_per_user
      ON subscriptions(user_id)
      WHERE status IN ('active', 'trial');
  END IF;
END $$;

-- 8. Create invoices table if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    CREATE TABLE invoices (
      invoice_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_id uuid NOT NULL REFERENCES subscriptions(id),
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      paid BOOLEAN NOT NULL DEFAULT false,
      payment_date TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- 9. Add index for invoices.user_id if both table and column exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id') AND
     NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_invoices_user_id') THEN
    CREATE INDEX idx_invoices_user_id ON invoices(user_id);
  END IF;
END $$;

-- 10. Comments (optional, safe to rerun)
COMMENT ON TABLE subscriptions IS 'Manages user subscription tiers, quotas, and status.';
COMMENT ON COLUMN subscriptions.user_id IS 'Foreign key to the users table.';
COMMENT ON COLUMN subscriptions.end_date IS 'The date when the current subscription period ends. Null for enterprise or lifetime plans.';
COMMENT ON COLUMN subscriptions.deliveries_used IS 'Counter for deliveries made in the current billing cycle.';
COMMENT ON COLUMN subscriptions.sms_used IS 'Counter for SMS messages sent in the current billing cycle.';
COMMENT ON TABLE invoices IS 'Records all payment transactions and billing events.';
COMMENT ON COLUMN invoices.subscription_id IS 'The specific subscription this invoice is for.';
COMMENT ON COLUMN invoices.amount IS 'The amount due for the invoice.';

-- 11. Auto-provision trial subscription for new users
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if user does not already have a subscription
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = NEW.id
  ) THEN
    INSERT INTO subscriptions (
      user_id, tier, status, start_date, end_date, deliveries_used, sms_used, created_at, updated_at
    ) VALUES (
      NEW.id, 'starter', 'trial', NOW(), NOW() + INTERVAL '7 days', 0, 0, NOW(), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_trial_subscription ON users;
CREATE TRIGGER trigger_create_trial_subscription
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_trial_subscription(); 