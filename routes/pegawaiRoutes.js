const express = require('express');
const router = express.Router();
const db = require('../config/db'); // KONEKSI DATABASE (Wajib ada)
const pegawaiController = require('../controllers/pegawaiController'); // CONTROLLER

// --- 1. API UTAMA (Pakai Controller) ---

// Ambil Semua Data (Untuk Dropdown di Form SPPD & Tabel Database)
router.get('/data/all', pegawaiController.getAllPegawai);

// Ambil Satu Data Detail (Untuk Edit)
router.get('/detail/:id', pegawaiController.getPegawaiById);

// Simpan, Update, Hapus
router.post('/save', pegawaiController.createPegawai);
router.put('/update/:id', pegawaiController.updatePegawai);
router.delete('/delete/:id', pegawaiController.deletePegawai);

// --- 2. API KHUSUS FILTER (Untuk Radio Button PNS/PPPK/Komisioner) ---
// Route ini menangkap request seperti: /api/pegawai/PNS
router.get('/:kategori', (req, res) => {
    const kategori = req.params.kategori;

    // Debugging: Cek di terminal apakah request masuk
    console.log(`[API] Request masuk filter kategori: ${kategori}`);

    const sql = 'SELECT * FROM master_pegawai WHERE kategori = ? ORDER BY nama_pegawai ASC';

    db.query(sql, [kategori], (err, results) => {
        if (err) {
            // Tampilkan error jelas di Terminal VS Code
            console.error('[DATABASE ERROR]:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json(results);
    });
});

module.exports = router;
