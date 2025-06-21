import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node morres-app/temp_hash.js <password-to-hash>');
  process.exit(1);
}

const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log(`Password: ${password}`);
    console.log(`Hash:     ${hash}`);
});
