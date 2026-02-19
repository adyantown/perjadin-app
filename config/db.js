require('dotenv').config();
const mysql = require('mysql2');

// Kita tidak butuh 'fs' dan 'path' lagi karena sertifikatnya lewat variabel

let pool;

if (process.env.DB_HOST) {
    // --- KONFIGURASI CLOUD (AIVEN) ---
    console.log('🌐 Menggunakan Konfigurasi CLOUD (Pool)...');

    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 17184,
        waitForConnections: true,
        connectionLimit: 5, // Batasi koneksi (Penting buat Free Tier Aiven)
        queueLimit: 0,
        ssl: {
            // Ambil sertifikat dari Environment Variable Vercel
            ca: process.env.DB_SSL_CA,
            rejectUnauthorized: true,
        },
    });
} else {
    // --- KONFIGURASI LOCAL (XAMPP) ---
    console.log('🏠 Menggunakan Konfigurasi LOCAL...');

    pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'db_kpu',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
}

// Tes koneksi awal (Optional, tapi bagus buat debug)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal Konek Database:', err.message);
    } else {
        console.log('✅ BERHASIL Terhubung ke Database!');
        connection.release(); // Jangan lupa lepaskan koneksi setelah tes
    }
});

module.exports = pool;
