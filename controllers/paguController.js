const db = require('../config/db');
const logController = require('./logController');

// Mengambil semua data Pagu
exports.getAllPagu = (req, res) => {
    db.query('SELECT * FROM pagu_anggaran', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
};

// Fitur Smart Revisi Pagu (Khusus Admin/PPK)
exports.revisiPagu = (req, res) => {
    const id = req.params.id;
    const paguBaru = parseFloat(req.body.pagu_baru);

    // 1. Intip dulu Pagu dan Sisa yang lama
    db.query('SELECT pagu_awal, sisa_pagu FROM pagu_anggaran WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data Pagu tidak ditemukan!' });

        const paguLama = parseFloat(rows[0].pagu_awal);
        const sisaLama = parseFloat(rows[0].sisa_pagu);

        // 2. Hitung selisihnya (Bisa minus kalau anggarannya dipotong negara, bisa plus kalau ditambah)
        const selisih = paguBaru - paguLama;
        const sisaBaru = sisaLama + selisih;

        // 3. Simpan angka yang sudah dikalkulasi ke database
        const updateQuery = 'UPDATE pagu_anggaran SET pagu_awal = ?, sisa_pagu = ? WHERE id = ?';
        db.query(updateQuery, [paguBaru, sisaBaru, id], (err2) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });
            logController.catatLog(req, 'Revisi Pagu', `Melakukan revisi Pagu DIPA ID: ${id} menjadi Rp. ${paguBaru}`);
            res.json({ success: true, message: 'Revisi DIPA berhasil! Sisa anggaran otomatis disesuaikan.' });
        });
    });
};
