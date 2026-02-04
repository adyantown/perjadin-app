const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Sesuaikan dengan lokasi file koneksi db Mas
const pegawaiController = require('../controllers/pegawaiController');

// --- [BARU] API AMBIL SEMUA PEGAWAI (Urut Prioritas) ---
// Endpoint ini nanti jadi: /api/pegawai/data/all
router.get('/data/all', (req, res) => {
    const sql = `
        SELECT * FROM master_pegawai 
        ORDER BY FIELD(kategori, 'Komisioner', 'PNS', 'PPPK'), nama_pegawai ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        // Kita bungkus pakai format { success: true, data: ... } biar sama kayak handler frontend
        res.json({ success: true, data: results });
    });
});

// --- API ENDPOINTS ---

// 1. Ambil Semua Data (Untuk Tabel & Dropdown)
router.get('/data/all', pegawaiController.getAllPegawai);

// 2. Ambil Satu Data (Untuk Edit)
router.get('/detail/:id', pegawaiController.getPegawaiById);

// 3. Simpan Baru
router.post('/save', pegawaiController.createPegawai);

// 4. Update Data
router.put('/update/:id', pegawaiController.updatePegawai);

// 5. Hapus Data
router.delete('/delete/:id', pegawaiController.deletePegawai);

// --- [LAMA] API ambil data per kategori (Biarkan saja) ---
router.get('/:kategori', (req, res) => {
    const kategori = req.params.kategori;
    const sql = 'SELECT * FROM master_pegawai WHERE kategori = ? ORDER BY nama_pegawai ASC';

    db.query(sql, [kategori], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

module.exports = router;
