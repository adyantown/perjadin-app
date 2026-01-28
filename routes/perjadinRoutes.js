const express = require('express');
const router = express.Router();
const controller = require('../controllers/perjadinControllers');

router.get('/get-perjadin', controller.getAll);
router.get('/get-perjadin/:id', controller.getById);
router.post('/save-perjadin', controller.save);
router.delete('/delete-perjadin/:id', controller.delete);
// Tambahkan route getById untuk edit juga

console.log('Cek Fungsi Controller:', {
    getAll: typeof controller.getAll,
    getById: typeof controller.getById,
    save: typeof controller.save,
    delete: typeof controller.delete,
});

module.exports = router;
