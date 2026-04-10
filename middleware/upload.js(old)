const multer = require('multer');
const path = require('path');

// Konfigurasi Penyimpanan PDF SPJ (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // File masuk ke folder public/uploads
    },
    filename: (req, file, cb) => {
        // Nama file: SPJ-TIMESTAMP-ACAK.pdf
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'SPJ-' + unique + path.extname(file.originalname));
    },
});

// Filter khusus PDF & Limit 10MB
const uploadSpj = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file PDF yang diperbolehkan!'));
        }
    },
});

module.exports = { uploadSpj };
