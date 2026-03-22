// routes/paguRoutes.js
const express = require('express');
const router = express.Router();
const paguController = require('../controllers/paguController');
const kakController = require('../controllers/kakController');
const { route } = require('./perjadinRoutes');

// --- MIDDLEWARE LOKAL (SATPAM ADMIN SASETAN) ---
// Mengecek apakah yang akses punya tiket 'admin' di session-nya
const satpamAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        next(); // Kalau admin, silakan lewat!
    } else {
        res.status(403).json({ success: false, message: 'Akses ditolak! Hanya Admin/PPK yang boleh merevisi Pagu.' });
    }
};

// --- RUTE ---

// GET: /api/pagu/all
// Bebas diakses oleh siapa saja (termasuk User) untuk bikin RAB
router.get('/all', paguController.getAllPagu);
router.get('/all', kakController.getAllPagu);

// PUT: /api/pagu/revisi/:id
// KHUSUS ADMIN: Kita pasang 'satpamAdmin' di tengah-tengahnya
router.put('/revisi/:id', satpamAdmin, paguController.revisiPagu);

module.exports = router;
