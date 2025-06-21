import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const saltRounds = 10;

async function hashExistingPasswords() {
  console.log('Starting password migration...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const res = await client.query('SELECT id, username, password FROM users');
    const users = res.rows;

    if (users.length === 0) {
      console.log('No users found to migrate.');
      return;
    }

    console.log(`Found ${users.length} users to process.`);

    for (const user of users) {
      // Basic check to see if password might already be a bcrypt hash
      if (user.password.startsWith('$2b$')) {
        console.log(`Skipping user ${user.username} (password may already be hashed).`);
        continue;
      }
      
      console.log(`Hashing password for user: ${user.username}...`);
      const hash = await bcrypt.hash(user.password, saltRounds);
      
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hash, user.id]
      );
      console.log(`Successfully updated password for ${user.username}.`);
    }

    await client.query('COMMIT');
    console.log('Password migration completed successfully.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during password migration:', error);
    console.error('Transaction rolled back.');
  } finally {
    client.release();
    pool.end();
  }
}

hashExistingPasswords(); 