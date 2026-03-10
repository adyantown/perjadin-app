const express = require('express');
const router = express.Router();
const controller = require('../controllers/perjadinController');

router.get('/all', controller.getAll);
router.get('/view/:id', controller.getById);
router.post('/save', controller.save);
router.delete('/delete/:id', controller.delete);
router.get('/analitik/:id', controller.getAnalitikPegawai);
// Tambahkan route getById untuk edit juga

module.exports = router;
