# Dar Logistics Migrations

## Migration Philosophy

- **Monolithic for core, modular for features:**
  - `postgresql-schema.sql`: Defines all core tables, enums, and triggers (users, deliveries, parent_bookings, etc.).
  - Modular scripts (`add_subscription_schema.sql`, `add_notifications_table.sql`, `add_refresh_tokens_table.sql`): Feature-specific, idempotent, and additive. No duplication with core schema.
- **Idempotency:** All scripts are safe to re-run.
- **Seeding:** Dev/test data is seeded only via explicit seed scripts, never in schema files.

## Migration Order

1. `postgresql-schema.sql` (core tables/enums/triggers)
2. `add_subscription_schema.sql` (subscriptions, invoices, add-ons)
3. `add_notifications_table.sql` (notifications)
4. `add_refresh_tokens_table.sql` (refresh token support)
5. `data-fix.sql` (patches/fixes)

Run all via `./auto-migrate.sh` (requires `DATABASE_URL` env var).

## Dev Seeding

- To seed dev users: `psql $DATABASE_URL -f seed-dev-users.sql`
- To seed dev subscriptions: `psql $DATABASE_URL -f seed-dev-subscriptions.sql`
- **Never** seed users or subscriptions in schema files.

## Best Practices

- **Add new features as modular scripts** (e.g., `add_feature_x.sql`).
- **Never duplicate table/enum/trigger logic** between core and modular scripts.
- **Document** each migration with a top-of-file comment.
- **Keep seeders separate** from schema logic.
- **Review** all migrations for idempotency and safe re-runs.

## For Future Maintainers

- Update this README with any changes to migration order or philosophy.
- When adding new tables or features, prefer modular scripts unless they are core to all deployments.
- If you change the core schema, check for drift with all modular scripts.
- For questions, contact the system architect or lead dev. 