import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Map of dev usernames to their expected plaintext passwords
const userPasswords = {
  hanzo: 'hanzo1234#',
  operator1: 'password1234',
  operator2: 'pass1234',
  operator3: 'operator12',
};

async function checkUserPasswords() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT username, password FROM users');
    for (const user of res.rows) {
      const expectedPassword = userPasswords[user.username];
      if (!expectedPassword) {
        console.log(`User ${user.username}: No expected password in script (skipped)`);
        continue;
      }
      const match = await bcrypt.compare(expectedPassword, user.password);
      if (match) {
        console.log(`User ${user.username}: ✅ Password matches expected dev password.`);
      } else {
        console.log(`User ${user.username}: ❌ Password does NOT match expected dev password!`);
      }
    }
  } catch (err) {
    console.error('Error checking user passwords:', err);
  } finally {
    client.release();
    pool.end();
  }
}

checkUserPasswords(); 