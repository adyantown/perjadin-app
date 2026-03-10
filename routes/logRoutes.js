const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// Route untuk mengambil data log (Hanya bisa diakses admin)
router.get('/', logController.getLogs);

module.exports = router;
