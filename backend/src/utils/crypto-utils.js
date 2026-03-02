const crypto = require('crypto');

/**
 * Generates a SHA-256 hash of a string.
 * This matches the frontend's pre-hash for E2EE.
 * @param {string} text 
 * @returns {string} hex hash
 */
function sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = {
    sha256
};
