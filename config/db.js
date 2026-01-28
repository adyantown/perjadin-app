const mysql = require('mysql2');

// KONEKSI MYSQL (XAMPP)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_kpu',
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
