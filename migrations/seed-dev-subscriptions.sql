-- Ensure each dev user has a current, active subscription (preserve history)
-- For: hanzo (1), operator1 (2), operator2 (3), operator3 (4)

-- hanzo
UPDATE subscriptions
SET
  tier = 'starter',
  status = 'active',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '30 days',
  deliveries_used = 0,
  sms_used = 0
WHERE user_id = 1
  AND (status != 'active' OR end_date < NOW() OR end_date IS NULL);

INSERT INTO subscriptions (user_id, tier, status, start_date, end_date, deliveries_used, sms_used)
SELECT 1, 'starter', 'active', NOW(), NOW() + INTERVAL '30 days', 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = 1 AND status = 'active' AND end_date > NOW()
);

-- operator1
UPDATE subscriptions
SET
  tier = 'starter',
  status = 'active',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '30 days',
  deliveries_used = 0,
  sms_used = 0
WHERE user_id = 2
  AND (status != 'active' OR end_date < NOW() OR end_date IS NULL);

INSERT INTO subscriptions (user_id, tier, status, start_date, end_date, deliveries_used, sms_used)
SELECT 2, 'starter', 'active', NOW(), NOW() + INTERVAL '30 days', 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = 2 AND status = 'active' AND end_date > NOW()
);

-- operator2
UPDATE subscriptions
SET
  tier = 'starter',
  status = 'active',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '30 days',
  deliveries_used = 0,
  sms_used = 0
WHERE user_id = 3
  AND (status != 'active' OR end_date < NOW() OR end_date IS NULL);

INSERT INTO subscriptions (user_id, tier, status, start_date, end_date, deliveries_used, sms_used)
SELECT 3, 'starter', 'active', NOW(), NOW() + INTERVAL '30 days', 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = 3 AND status = 'active' AND end_date > NOW()
);

-- operator3
UPDATE subscriptions
SET
  tier = 'starter',
  status = 'active',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '30 days',
  deliveries_used = 0,
  sms_used = 0
WHERE user_id = 4
  AND (status != 'active' OR end_date < NOW() OR end_date IS NULL);

INSERT INTO subscriptions (user_id, tier, status, start_date, end_date, deliveries_used, sms_used)
SELECT 4, 'starter', 'active', NOW(), NOW() + INTERVAL '30 days', 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = 4 AND status = 'active' AND end_date > NOW()
); 