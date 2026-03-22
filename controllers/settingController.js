const db = require('../config/db');
const logController = require('./logController');

// Ambil data setting (selalu ambil ID 1)
exports.getSettings = (req, res) => {
    db.query('SELECT * FROM setting_pejabat WHERE id = 1', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows[0] || {} });
    });
};

// Update data setting
// Update data setting (HANYA ADMIN YANG BOLEH!)
exports.updateSettings = (req, res) => {
    // --- GEMBOK PENGAMAN KHUSUS ADMIN ---
    if (req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses Ditolak! Hanya Admin yang boleh mengubah nama Pejabat.' });
    }
    // ------------------------------------

    const data = req.body;
    db.query('UPDATE setting_pejabat SET ? WHERE id = 1', data, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        logController.catatLog(req, 'Pengaturan Sistem', 'Menyimpan perubahan pengaturan Pejabat/Bendahara dll.');
        res.json({ success: true, message: 'Pengaturan pejabat berhasil disimpan!' });
    });
};
