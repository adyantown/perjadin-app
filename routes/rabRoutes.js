// routes/rabRoutes.js
const express = require('express');
const router = express.Router();
const rabController = require('../controllers/rabController');

router.get('/kandidat-kak', rabController.getKandidatKak);
router.post('/save', rabController.saveRab);
router.get('/all', rabController.getAllRab);
router.get('/view/:id', rabController.getRabById);
router.delete('/delete/:id', rabController.deleteRab);
router.put('/update/:id', rabController.updateRab);

module.exports = router;
