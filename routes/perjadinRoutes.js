const express = require('express');
const router = express.Router();
const controller = require('../controllers/perjadinControllers');

router.get('/all', controller.getAll);
router.get('/view/:id', controller.getById);
router.post('/save', controller.save);
router.delete('/delete/:id', controller.delete);
// Tambahkan route getById untuk edit juga

module.exports = router;
