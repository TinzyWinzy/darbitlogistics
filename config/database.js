import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// For Render deployment, use the internal connection string if available
const connectionString = process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL;

const pool = connectionString 
  ? new pg.Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : new pg.Pool({
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'morres',
      password: process.env.PGPASSWORD || 'postgres',
      port: parseInt(process.env.PGPORT || '5432'),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  if (process.env.NODE_ENV === 'production') {
    console.error('Database connection error in production - attempting to reconnect...');
  }
});

// Test the connection with retries
const testConnection = async () => {
  let retries = 5;
  while (retries) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL');
      console.log('Connection details:', {
        user: pool.options.user,
        host: pool.options.host,
        database: pool.options.database,
        ssl: !!pool.options.ssl
      });
      client.release();
      break;
    } catch (err) {
      console.error(`Connection attempt ${6 - retries}/5 failed:`, err.message);
      if (err.code === 'ECONNREFUSED') {
        console.error('Connection refused. Check if PostgreSQL is running and the connection details are correct.');
      }
      retries -= 1;
      if (retries === 0) {
        console.error('Could not connect to database after 5 attempts');
        if (process.env.NODE_ENV === 'production') {
          console.error('Fatal error in production - check database configuration');
          process.exit(1);
        }
      }
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

testConnection();

export default pool; 