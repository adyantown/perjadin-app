const express = require('express');
const router = express.Router();
const controller = require('../controllers/perjadinControllers');

router.get('/get-perjadin', controller.getAll);
router.get('/get-perjadin/:id', controller.getById);
router.post('/save-perjadin', controller.save);
router.delete('/delete-perjadin/:id', controller.delete);
// Tambahkan route getById untuk edit juga

module.exports = router;
