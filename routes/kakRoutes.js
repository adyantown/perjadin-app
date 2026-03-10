// routes/kakRoutes.js
const express = require('express');
const router = express.Router();
const kakController = require('../controllers/kakController');

// POST: /api/kak/save
router.post('/save', kakController.saveKak);
// GET: /api/kak/all (Untuk tabel riwayat)
router.get('/all', kakController.getAllKak);
// GET: /api/kak/view/:id (Untuk cetak 1 dokumen)
router.get('/view/:id', kakController.getKakById);
module.exports = router;
