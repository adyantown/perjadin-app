// routes/dokumentasiRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/dokumentasiController');
const multer = require('multer');
const path = require('path');

// Konfigurasi Penyimpanan File (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Foto masuk ke folder public/uploads
    },
    filename: (req, file, cb) => {
        // Nama file: bukti-TIMESTAMP-ACAK.jpg
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'bukti-' + unique + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Definisi Route
router.post('/upload', upload.single('foto'), controller.uploadBukti); // API Upload
router.get('/galeri', controller.getAllGaleri); // API Galeri

module.exports = router;
