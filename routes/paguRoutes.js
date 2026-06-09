// routes/paguRoutes.js
const express = require('express');
const router = express.Router();
const paguController = require('../controllers/paguController');
const kakController = require('../controllers/kakController');
const { route } = require('./perjadinRoutes');

const { hanyaAdmin } = require('../middleware/authMiddleware');

// --- RUTE ---

// GET: /api/pagu/all
// Bebas diakses oleh siapa saja (termasuk User) untuk bikin RAB
router.get('/all', paguController.getAllPagu);
router.get('/all', kakController.getAllPagu);

// PUT: /api/pagu/revisi/:id
// KHUSUS ADMIN: Kita pasang 'satpamAdmin' di tengah-tengahnya
router.put('/revisi/:id', hanyaAdmin, paguController.revisiPagu);

module.exports = router;
