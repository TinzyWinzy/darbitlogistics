#!/usr/bin/env node
// Schema health check for Dar Logistics
// Usage: node check-schema-health.js
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable not set.');
  process.exit(1);
}

const TABLES = [
  {
    name: 'users',
    columns: ['id', 'username', 'password', 'role']
  },
  {
    name: 'parent_bookings',
    columns: ['id', 'customer_name', 'total_tonnage', 'mineral_type', 'loading_point', 'deadline']
  },
  {
    name: 'deliveries',
    columns: ['tracking_id', 'parent_booking_id', 'customer_name', 'current_status', 'tonnage', 'container_count', 'driver_details']
  },
  {
    name: 'checkpoint_logs',
    columns: ['id', 'delivery_tracking_id', 'checkpoint_type', 'location', 'operator_id', 'status', 'created_at']
  },
  {
    name: 'environmental_incidents',
    columns: ['id', 'delivery_tracking_id', 'incident_type', 'severity', 'reported_by_user_id', 'location', 'status']
  },
  {
    name: 'sampling_records',
    columns: ['id', 'delivery_tracking_id', 'sample_code', 'collected_by_user_id', 'collection_location', 'collection_date', 'sample_type']
  },
  {
    name: 'sessions',
    columns: ['session_id', 'username', 'expires_at']
  }
];

async function checkTable(client, table) {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [table.name]
  );
  const foundCols = res.rows.map(r => r.column_name);
  const missingCols = table.columns.filter(col => !foundCols.includes(col));
  return {
    exists: res.rows.length > 0,
    missingCols
  };
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  let allOk = true;
  console.log('Schema Health Check:');
  for (const table of TABLES) {
    const { exists, missingCols } = await checkTable(client, table);
    if (!exists) {
      allOk = false;
      console.log(`❌ Table missing: ${table.name}`);
    } else if (missingCols.length > 0) {
      allOk = false;
      console.log(`⚠️  Table ${table.name} missing columns: ${missingCols.join(', ')}`);
    } else {
      console.log(`✅ Table ${table.name} OK`);
    }
  }
  await client.end();
  if (!allOk) {
    console.log('\nSchema health check: FAIL');
    process.exit(1);
  } else {
    console.log('\nSchema health check: PASS');
    process.exit(0);
  }
})(); 