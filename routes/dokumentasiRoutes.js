// routes/dokumentasiRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/dokumentasiController');
const { uploadSpj } = require('../middleware/upload');
const { hanyaAdmin } = require('../middleware/authMiddleware');

// Definisi Route untuk SPJ
router.post('/upload', uploadSpj.single('file_pdf'), controller.uploadSpj); // Upload SPJ (User)
router.get('/semua', controller.getAllSpj); // Lihat Status SPJ (Semua User)
router.put('/verifikasi/:id', hanyaAdmin, controller.verifikasiSpj); // Eksekusi ACC/Revisi (Admin)
router.delete('/delete/:id', hanyaAdmin, controller.deleteSpj); // Hapus SPJ (Admin)

module.exports = router;

