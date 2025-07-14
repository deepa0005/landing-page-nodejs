const mysql = require('mysql2');

const pool = mysql.createPool({
  
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Check database connection
promisePool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Database connected successfully.');
    connection.release(); // Always release connection back to the pool
  })
  .catch(err => {
    console.error('❌ MySQL Database connection failed:', err.message);
  });

module.exports = promisePool;
// This code sets up a MySQL connection pool using the mysql2 library.