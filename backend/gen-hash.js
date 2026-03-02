const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const password = 'admin';
const sha256 = crypto.createHash('sha256').update(password).digest('hex');

bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(sha256, salt, (err, hash) => {
        console.log('SHA-256:', sha256);
        console.log('BCRYPT HASH:', hash);
    });
});
