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
// PUT: /api/kak/update/:id
router.put('/update/:id', kakController.updateKak);
// DELETE: /api/kak/delete/:id
router.delete('/delete/:id', kakController.deleteKak);

module.exports = router;
