const db = require('../config/db');

// 1. FUNGSI HELPER: Untuk mencatat aktivitas (Bisa dipanggil dari mana saja)
exports.catatLog = (req, aksi, keterangan) => {
    // Ambil data user dari sesi (kalau belum login, tulis 'Sistem' atau 'Anonim')
    const namaUser = req.session.nama || 'Sistem / Anonim';
    const roleUser = req.session.role || 'unknown';

    const sql = 'INSERT INTO log_aktivitas (nama_user, role, aksi, keterangan) VALUES (?, ?, ?, ?)';

    db.query(sql, [namaUser, roleUser, aksi, keterangan], (err) => {
        if (err) console.error('Gagal mencatat log CCTV:', err.message);
    });
};

// 2. FUNGSI GET: Untuk mengambil data log ke Halaman Admin
exports.getLogs = (req, res) => {
    // Ambil 100 aktivitas terbaru saja biar server tidak berat
    const sql = 'SELECT * FROM log_aktivitas ORDER BY waktu DESC LIMIT 100';

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
};
