UPDATE subscriptions SET deliveries_used = 0 WHERE deliveries_used IS NULL;
UPDATE subscriptions SET sms_used = 0 WHERE sms_used IS NULL; 