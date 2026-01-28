require('dotenv').config();
const mysql = require('mysql2');

// KONEKSI MYSQL (XAMPP)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_kpu',
    port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi MySQL: ' + err.message);
        return;
    }
    console.log('Mantap! Terhubung ke MySQL XAMPP.');
});
module.exports = db;

// APLIKASI EXPRESS
