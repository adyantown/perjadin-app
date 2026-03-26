const SettingModel = require('../models/settingModel');
const logController = require('./logController');

// Ambil data setting (selalu ambil ID 1)
exports.getSettings = async (req, res) => {
    try {
        const rows = await SettingModel.get();
        res.json({ success: true, data: rows[0] || {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update data setting (HANYA ADMIN YANG BOLEH!)
exports.updateSettings = async (req, res) => {
    // --- GEMBOK PENGAMAN KHUSUS ADMIN ---
    if (req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses Ditolak! Hanya Admin yang boleh mengubah nama Pejabat.' });
    }
    // ------------------------------------

    try {
        const data = req.body;
        await SettingModel.update(data);
        logController.catatLog(req, 'Pengaturan Sistem', 'Menyimpan perubahan pengaturan Pejabat/Bendahara dll.');
        res.json({ success: true, message: 'Pengaturan pejabat berhasil disimpan!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
