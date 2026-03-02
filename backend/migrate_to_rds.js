const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrate() {
    console.log('Starting migration to RDS...');
    const schema = fs.readFileSync('schema_no_bom.sql', 'utf8');

    const connection = await mysql.createConnection({
        host: 'pragathienterprises-db.cdqyyweoavim.ap-south-1.rds.amazonaws.com',
        user: 'admin',
        password: 'PragathiPass2024',
        multipleStatements: true
    });

    try {
        console.log('Connected to RDS. Running schema script...');
        await connection.query(schema);
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await connection.end();
    }
}

migrate();
