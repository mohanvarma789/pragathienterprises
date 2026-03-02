const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { sha256 } = require('../utils/crypto-utils');

async function migratePasswords() {
    try {
        const [users] = await pool.query('SELECT id, password FROM users');
        console.log(`Found ${users.length} users to migrate.`);

        for (const user of users) {
            // Check if already hashed (bcrypt hashes start with $2a$ or $2b$)
            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
                console.log(`User ${user.id} already has a hashed password. Skipping.`);
                continue;
            }

            console.log(`Hashing password for user ${user.id}...`);
            const preHashed = sha256(user.password);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(preHashed, salt);

            await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            console.log(`Migrated user ${user.id}.`);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migratePasswords();
