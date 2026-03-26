const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs'); // Wajib dipanggil untuk acak password
const logController = require('./logController'); // Jangan lupa CCTV kita

// 1. Ambil Semua User
exports.getAllUsers = async (req, res) => {
    try {
        const rows = await UserModel.getAll();
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Tambah User Baru
exports.createUser = async (req, res) => {
    try {
        const { username, password, nama_lengkap, role } = req.body;

        // Acak password sebelum masuk database
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        await UserModel.create(username, hashedPassword, nama_lengkap, role);

        try {
            logController.catatLog(req, 'Manajemen User', `Membuat akun baru: ${username}`);
        } catch (e) {}
        res.json({ success: true, message: 'Akun berhasil dibuat!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Username sudah dipakai!' });
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Reset Password User
exports.resetPassword = async (req, res) => {
    try {
        const id = req.params.id;
        const { passwordBaru } = req.body;

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(passwordBaru, salt);

        await UserModel.updatePassword(id, hashedPassword);

        try {
            logController.catatLog(req, 'Manajemen User', `Reset password untuk User ID: ${id}`);
        } catch (e) {}
        res.json({ success: true, message: 'Password berhasil direset!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Hapus User
exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;

        // Cegah admin menghapus dirinya sendiri (biar gak bunuh diri wkwk)
        if (id == req.session.userId) {
            return res.status(400).json({ success: false, message: 'Anda tidak bisa menghapus akun Anda sendiri saat sedang login!' });
        }

        await UserModel.delete(id);

        try {
            logController.catatLog(req, 'Manajemen User', `Menghapus User ID: ${id}`);
        } catch (e) {}
        res.json({ success: true, message: 'Akun berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
