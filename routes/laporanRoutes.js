const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const laporanController = require('../controllers/laporanController');

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../public/uploads/laporan');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter hanya gambar
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Hanya JPG/PNG yang diperbolehkan.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB per file
});

// Routes
// POST /api/laporan/save
router.post('/save', upload.array('foto_dokumentasi', 3), laporanController.saveLaporan);

// GET /api/laporan (Ambil semua daftar laporan)
router.get('/', laporanController.getAllLaporan);

// GET /api/laporan/available (Ambil SPPD yang belum dilaporin)
router.get('/available', laporanController.getAvailablePerjadin);

// GET /api/laporan/:perjadinId
router.get('/:perjadinId', laporanController.getLaporan);

// DELETE /api/laporan/:id
router.delete('/:id', laporanController.deleteLaporan);

module.exports = router;
