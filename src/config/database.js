const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: process.env.NODE_ENV === 'production' ? 5 : 10, // Lower limit for 2GB VPS
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ База данных подключена успешно');
        connection.release();
        return true;
    } catch (err) {
        console.error('✗ Ошибка подключения к базе данных:', err.message);
        console.error('  Проверьте настройки в .env файле');
        process.exit(1);
    }
}

// Initialize database connection
testConnection();

module.exports = pool;
