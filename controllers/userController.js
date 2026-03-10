const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Wajib dipanggil untuk acak password
const logController = require('./logController'); // Jangan lupa CCTV kita

// 1. Ambil Semua User
exports.getAllUsers = (req, res) => {
    db.query('SELECT id, username, nama_lengkap, role FROM users ORDER BY id DESC', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
};

// 2. Tambah User Baru
exports.createUser = (req, res) => {
    const { username, password, nama_lengkap, role } = req.body;

    // Acak password sebelum masuk database
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const sql = 'INSERT INTO users (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, hashedPassword, nama_lengkap, role], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Username sudah dipakai!' });
            return res.status(500).json({ success: false, message: err.message });
        }

        try {
            logController.catatLog(req, 'Manajemen User', `Membuat akun baru: ${username}`);
        } catch (e) {}
        res.json({ success: true, message: 'Akun berhasil dibuat!' });
    });
};

// 3. Reset Password User
exports.resetPassword = (req, res) => {
    const id = req.params.id;
    const { passwordBaru } = req.body;

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(passwordBaru, salt);

    db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        try {
            logController.catatLog(req, 'Manajemen User', `Reset password untuk User ID: ${id}`);
        } catch (e) {}
        res.json({ success: true, message: 'Password berhasil direset!' });
    });
};

// 4. Hapus User
exports.deleteUser = (req, res) => {
    const id = req.params.id;

    // Cegah admin menghapus dirinya sendiri (biar gak bunuh diri wkwk)
    if (id == req.session.userId) {
        return res.status(400).json({ success: false, message: 'Anda tidak bisa menghapus akun Anda sendiri saat sedang login!' });
    }

    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        try {
            logController.catatLog(req, 'Manajemen User', `Menghapus User ID: ${id}`);
        } catch (e) {}
        res.json({ success: true, message: 'Akun berhasil dihapus!' });
    });
};
