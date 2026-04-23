// controllers/pegawaiController.js
const PegawaiModel = require('../models/pegawaiModel');
const logController = require('./logController');

// 1. AMBIL SEMUA DATA (READ)
exports.getAllPegawai = async (req, res) => {
    try {
        const rows = await PegawaiModel.getAll();
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. AMBIL SATU DATA (Buat Edit)
exports.getPegawaiById = async (req, res) => {
    try {
        const id = req.params.id;
        const rows = await PegawaiModel.getById(id);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. TAMBAH DATA (CREATE)
exports.createPegawai = async (req, res) => {
    try {
        const data = req.body;
        await PegawaiModel.create(data);
        logController.catatLog(req, 'Master Pegawai', `Menambahkan pegawai baru: ${data.nama_pegawai || 'Tanpa Nama'}`);
        res.json({ success: true, message: 'Pegawai berhasil ditambahkan!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. UPDATE DATA (UPDATE)
exports.updatePegawai = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        await PegawaiModel.update(id, data);
        logController.catatLog(req, 'Master Pegawai', `Mengubah data pegawai: ${data.nama_pegawai || 'Tanpa Nama'}`);
        res.json({ success: true, message: 'Data pegawai berhasil diperbarui!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. FILTER BY KATEGORI (PNS/PPPK/Komisioner)
exports.getPegawaiByKategori = async (req, res) => {
    try {
        const kategori = req.params.kategori;
        const rows = await PegawaiModel.getByKategori(kategori);
        res.json(rows);
    } catch (err) {
        console.error('[DATABASE ERROR]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 6. HAPUS DATA (DELETE)
exports.deletePegawai = async (req, res) => {
    try {
        const id = req.params.id;
        const rows = await PegawaiModel.getById(id);
        const nama = rows.length > 0 ? rows[0].nama_pegawai : 'Tidak Diketahui';
        await PegawaiModel.delete(id);
        logController.catatLog(req, 'Master Pegawai', `Menghapus pegawai: ${nama}`);
        res.json({ success: true, message: 'Pegawai berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
