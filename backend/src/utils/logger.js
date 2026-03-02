const pool = require('../config/db');

/**
 * Log a change to the change_logs table.
 * @param {object} connection - MySQL connection or pool
 * @param {object} logData - { tableName, recordId, action, oldData, newData, changedBy }
 */
async function logChange(connection, { tableName, recordId, action, oldData, newData, changedBy }) {
    try {
        const query = `
            INSERT INTO change_logs (tableName, recordId, action, oldData, newData, changedBy)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [
            tableName,
            recordId,
            action,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            changedBy || 'system'
        ]);
    } catch (error) {
        console.error('Error in logChange:', error);
    }
}

module.exports = { logChange };
