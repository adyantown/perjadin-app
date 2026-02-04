// controllers/pegawaiController.js
const db = require('../config/db');

// 1. AMBIL SEMUA DATA (READ)
exports.getAllPegawai = (req, res) => {
    const sql = `SELECT * FROM master_pegawai ORDER BY FIELD(kategori, 'Komisioner', 'PNS', 'PPPK'), nama_pegawai ASC`;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
};

// 2. AMBIL SATU DATA (Buat Edit)
exports.getPegawaiById = (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM master_pegawai WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        res.json({ success: true, data: rows[0] });
    });
};

// 3. TAMBAH DATA (CREATE)
exports.createPegawai = (req, res) => {
    const data = req.body;
    db.query('INSERT INTO master_pegawai SET ?', data, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Pegawai berhasil ditambahkan!' });
    });
};

// 4. UPDATE DATA (UPDATE)
exports.updatePegawai = (req, res) => {
    const id = req.params.id;
    const data = req.body;
    db.query('UPDATE master_pegawai SET ? WHERE id = ?', [data, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Data pegawai berhasil diperbarui!' });
    });
};

// 5. HAPUS DATA (DELETE)
exports.deletePegawai = (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM master_pegawai WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Pegawai berhasil dihapus!' });
    });
};
