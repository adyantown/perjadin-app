const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

// GET: Semua user login bisa baca data pejabat (diperlukan untuk cetak SPPD, Kuitansi, dll)
router.get('/', settingController.getSettings);

// PUT: Hanya Admin yang bisa mengubah data pejabat
router.put('/', (req, res, next) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses Ditolak! Hanya Admin yang boleh mengubah pengaturan.' });
    }
    next();
}, settingController.updateSettings);

module.exports = router;
