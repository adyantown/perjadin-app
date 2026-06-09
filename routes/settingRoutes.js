const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { hanyaAdmin } = require('../middleware/authMiddleware');

// GET: Semua user login bisa baca data pejabat (diperlukan untuk cetak SPPD, Kuitansi, dll)
router.get('/', settingController.getSettings);

// PUT: Hanya Admin yang bisa mengubah data pejabat
router.put('/', hanyaAdmin, settingController.updateSettings);

module.exports = router;
