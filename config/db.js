require('dotenv').config();
const mysql = require('mysql2');

let pool;

// Jika di .env ada DB_HOST (artinya lagi di Cloud/Vercel)
if (process.env.DB_HOST) {
    console.log('🌐 Menggunakan Konfigurasi CLOUD (Aiven Pool)...');
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 17184,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        ssl: {
            ca: process.env.DB_SSL_CA,
            rejectUnauthorized: true,
        },
    });
} else {
    // JIKA TIDAK ADA DB_HOST (Artinya lagi di Laptop/Localhost)
    console.log('🏠 Menggunakan Konfigurasi LOCAL (XAMPP)...');
    pool = mysql.createPool({
        host: 'localhost', // Host XAMPP
        user: 'root', // User Default XAMPP
        password: '', // Password Default XAMPP (biasanya kosong)
        database: 'db_kpu', // Pastikan nama DB di phpMyAdmin sama
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
}

// ... kode tes koneksi ...
module.exports = pool;
