// routes/paguRoutes.js
const express = require('express');
const router = express.Router();
const kakController = require('../controllers/kakController');

// GET: /api/pagu/all
router.get('/all', kakController.getAllPagu);

module.exports = router;
