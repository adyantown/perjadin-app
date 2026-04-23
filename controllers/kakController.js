const KakModel = require('../models/kakModel');
const logController = require('./logController');

// ==========================================
// MENGAMBIL SEMUA DATA PAGU (Untuk Dropdown)
// ==========================================
exports.getAllPagu = async (req, res) => {
    try {
        const results = await KakModel.getAllPagu();
        res.json(results);
    } catch (err) {
        console.error('Error fetch pagu:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pagu anggaran' });
    }
};

// ==========================================
// MENYIMPAN DOKUMEN KAK BARU
// ==========================================
exports.saveKak = async (req, res) => {
    try {
        const data = req.body;
        const result = await KakModel.create(data);
        logController.catatLog(req, 'Buat KAK', `Membuat KAK Baru: ${data.judul_kegiatan}`);
        res.json({ success: true, message: 'KAK berhasil disimpan!', id: result.insertId });
    } catch (err) {
        console.error('Error insert KAK:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan Kerangka Acuan Kerja' });
    }
};

// ==========================================
// MENGAMBIL SEMUA DATA RIWAYAT KAK
// ==========================================
exports.getAllKak = async (req, res) => {
    try {
        const results = await KakModel.getAll();
        res.json(results);
    } catch (err) {
        console.error('Error fetch riwayat KAK:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data riwayat KAK' });
    }
};

// ==========================================
// MENGAMBIL 1 DATA KAK SPESIFIK UNTUK DICETAK
// ==========================================
exports.getKakById = async (req, res) => {
    try {
        const id = req.params.id;
        const results = await KakModel.getById(id);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Data KAK tidak ditemukan' });
        }
        res.json({ success: true, data: results[0] });
    } catch (err) {
        console.error('Error fetch KAK by ID:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data KAK' });
    }
};

// ==========================================
// MENGHAPUS DATA KAK (Hanya jika belum ada RAB)
// ==========================================
exports.deleteKak = async (req, res) => {
    try {
        const kakId = req.params.id;
        const rows = await KakModel.getById(kakId);
        const namaKak = rows.length > 0 ? rows[0].judul_kegiatan : 'Tidak Diketahui';
        await KakModel.delete(kakId);
        logController.catatLog(req, 'Hapus KAK', `Menghapus KAK: ${namaKak}`);
        res.json({ success: true, message: 'Data KAK berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menghapus KAK.' });
    }
};

// ==========================================
// UPDATE DATA KAK
// ==========================================
exports.updateKak = async (req, res) => {
    try {
        const kakId = req.params.id;
        const data = req.body;
        await KakModel.update(kakId, data);
        logController.catatLog(req, 'Edit KAK', `Mengubah KAK: ${data.judul_kegiatan || 'Tidak Diketahui'}`);
        res.json({ success: true, message: 'Data KAK berhasil diperbarui!' });
    } catch (err) {
        console.error('Error update KAK:', err);
        res.status(500).json({ success: false, message: 'Gagal mengupdate KAK.' });
    }
};
