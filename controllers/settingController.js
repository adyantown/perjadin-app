const db = require('../config/db');

// Ambil data setting (selalu ambil ID 1)
exports.getSettings = (req, res) => {
    db.query('SELECT * FROM setting_pejabat WHERE id = 1', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows[0] || {} });
    });
};

// Update data setting
exports.updateSettings = (req, res) => {
    const data = req.body;
    db.query('UPDATE setting_pejabat SET ? WHERE id = 1', data, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Pengaturan pejabat berhasil disimpan!' });
    });
};
