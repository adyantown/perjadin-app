const PaguModel = require('../models/paguModel');
const logController = require('./logController');

// Mengambil semua data Pagu
exports.getAllPagu = async (req, res) => {
    try {
        const results = await PaguModel.getAll();
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Fitur Smart Revisi Pagu (Khusus Admin/PPK)
exports.revisiPagu = async (req, res) => {
    try {
        const id = req.params.id;
        const paguBaru = parseFloat(req.body.pagu_baru);

        // 1. Intip dulu Pagu dan Sisa yang lama
        const rows = await PaguModel.getById(id);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data Pagu tidak ditemukan!' });
        }

        const paguLama = parseFloat(rows[0].pagu_awal);
        const sisaLama = parseFloat(rows[0].sisa_pagu);

        // 2. Hitung selisihnya (Bisa minus kalau anggarannya dipotong negara, bisa plus kalau ditambah)
        const selisih = paguBaru - paguLama;
        const sisaBaru = sisaLama + selisih;

        // 3. Simpan angka yang sudah dikalkulasi ke database
        await PaguModel.updatePaguAndSisa(id, paguBaru, sisaBaru);
        logController.catatLog(req, 'Revisi Pagu', `Melakukan revisi Pagu DIPA ID: ${id} menjadi Rp. ${paguBaru}`);
        res.json({ success: true, message: 'Revisi DIPA berhasil! Sisa anggaran otomatis disesuaikan.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
