const db = require('../config/dbPromise');

exports.insertLog = (namaUser, role, aksi, keterangan) => {
    return db.query(
        'INSERT INTO log_aktivitas (nama_user, role, aksi, keterangan) VALUES (?, ?, ?, ?)',
        [namaUser, role, aksi, keterangan]
    );
};

exports.getRecentLogs = (limit = 100) => {
    return db.query('SELECT * FROM log_aktivitas ORDER BY waktu DESC LIMIT ?', [limit]);
};
