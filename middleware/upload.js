const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Konfigurasi Penyimpanan PDF SPJ (Cloudinary)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'perjadin_kpu',
        resource_type: 'raw', // WAJIB untuk file non-image (PDF)
        public_id: (req, file) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            return 'SPJ-' + unique + '.pdf';
        },
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

// Konfigurasi Penyimpanan Foto Laporan (Cloudinary)
const storageLaporan = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'laporan_perjadin',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Khusus gambar
        public_id: (req, file) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            return 'FOTO-' + unique;
        },
    },
});

const uploadLaporanFoto = multer({
    storage: storageLaporan,
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5 MB per foto
});

module.exports = { uploadSpj, uploadLaporanFoto };
