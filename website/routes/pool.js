// One MySQL connection pool for the library database, shared by all library routes
const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.LIBRARY_DB_NAME || 'library',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
