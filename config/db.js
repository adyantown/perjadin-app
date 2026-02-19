require('dotenv').config(); // Panggil kamus rahasia
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

let dbConfig;

// LOGIKA PINTAR:
// Jika di file .env ada DB_HOST (artinya kita mau pakai Aiven/Cloud),
// maka pakai konfigurasi Cloud.
if (process.env.DB_HOST) {
    console.log('🌐 Menggunakan Konfigurasi CLOUD (Aiven)...');

    dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: {
            // Pastikan file ca.pem ada di folder config
            ca: fs.readFileSync(path.join(__dirname, 'ca.pem')),
        },
    };
} else {
    // Jika tidak ada DB_HOST di .env, kita anggap pakai XAMPP (Lokal)
    console.log('🏠 Menggunakan Konfigurasi LOCAL (XAMPP)...');

    dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'db_kpu',
    };
}

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('❌ Gagal Konek Database:', err.message);
        return;
    }
    console.log('✅ BERHASIL Terhubung ke Database!');
});

module.exports = db;
