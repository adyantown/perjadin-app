const express = require('express');
const router = express.Router();
const sppdController = require('../controllers/sppdController');

// Route khusus simpan data SPPD
router.post('/save', sppdController.saveSppd);
router.get('/all', sppdController.getAllSppd); // Ambil semua
router.get('/view/:id', sppdController.getSppdById); // Ambil satu (buat edit)
router.delete('/delete/:id', sppdController.deleteSppd); // Hapus
router.put('/update/:id', sppdController.updateSppd);

module.exports = router;
