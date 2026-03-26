// routes/dokumentasiRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/dokumentasiController');
const { uploadSpj } = require('../middleware/upload');

// Definisi Route untuk SPJ
router.post('/upload', uploadSpj.single('file_pdf'), controller.uploadSpj); // Upload SPJ (User)
router.get('/semua', controller.getAllSpj); // Lihat Antrean SPJ (Admin)
router.put('/verifikasi/:id', controller.verifikasiSpj); // Eksekusi ACC/Revisi (Admin)
router.delete('/delete/:id', controller.deleteSpj); // Hapus SPJ (Opsional)

module.exports = router;

