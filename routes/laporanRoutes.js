const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const { uploadLaporanFoto } = require('../middleware/upload');

// Routes
// POST /api/laporan/save
router.post('/save', uploadLaporanFoto.array('foto_dokumentasi', 3), laporanController.saveLaporan);

// GET /api/laporan (Ambil semua daftar laporan)
router.get('/', laporanController.getAllLaporan);

// GET /api/laporan/available (Ambil SPPD yang belum dilaporin)
router.get('/available', laporanController.getAvailablePerjadin);

// GET /api/laporan/:perjadinId
router.get('/:perjadinId', laporanController.getLaporan);

// DELETE /api/laporan/:id
router.delete('/:id', laporanController.deleteLaporan);

module.exports = router;
