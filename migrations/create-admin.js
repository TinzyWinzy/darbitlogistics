import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const saltRounds = 10;

async function createAdmin() {
  const args = process.argv.slice(2);
  const username = args[0];
  const password = args[1];

  if (!username || !password) {
    console.error('Usage: node migrations/create-admin.js <username> <password>');
    console.error('Please provide a username and password.');
    process.exit(1);
  }

  console.log(`Attempting to create admin user: ${username}...`);

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hash, 'admin']
    );
    
    console.log(`✅ Admin user '${username}' created successfully.`);
    console.log('You can now log in with this user.');

  } catch (error) {
    if (error.code === '23505') { // unique_violation
      console.error(`❌ Error: Username '${username}' already exists.`);
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  } finally {
    await pool.end();
  }
}

createAdmin(); 