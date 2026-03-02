const mysql = require('mysql2/promise');

async function checkLocalDB() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'pragathienterprises'
    };

    console.log('Connecting to local database...');
    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected. Checking products table schema...');
        const [rows] = await connection.query('DESCRIBE products');
        console.table(rows);

        const imageUrlField = rows.find(r => r.Field === 'imageUrl');
        if (imageUrlField && imageUrlField.Type !== 'longtext') {
            console.log(`Consolidating local DB: Modifying imageUrl from ${imageUrlField.Type} to LONGTEXT...`);
            await connection.query('ALTER TABLE products MODIFY imageUrl LONGTEXT');
            console.log('Local DB migration successful!');
        } else {
            console.log('Local DB is already up to date (imageUrl is LONGTEXT).');
        }

    } catch (err) {
        console.error('Error checking local DB:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkLocalDB();
