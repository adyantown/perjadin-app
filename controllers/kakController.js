const db = require('../config/db');
const logController = require('./logController');

// ==========================================
// MENGAMBIL SEMUA DATA PAGU (Untuk Dropdown)
// ==========================================
exports.getAllPagu = (req, res) => {
    const query = 'SELECT id, nama_kamar, sisa_pagu FROM pagu_anggaran ORDER BY id ASC';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetch pagu:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data pagu anggaran' });
        }
        res.json(results);
    });
};

// ==========================================
// MENYIMPAN DOKUMEN KAK BARU
// ==========================================
exports.saveKak = (req, res) => {
    const data = req.body;

    const query = `INSERT INTO dokumen_kak 
        (pagu_id, judul_kegiatan, latar_belakang, dasar_hukum, maksud_tujuan, output_kegiatan, tgl_kak, ppk_nama, ppk_nip, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`;

    const values = [data.pagu_id, data.judul_kegiatan, data.latar_belakang, data.dasar_hukum, data.maksud_tujuan, data.output_kegiatan, data.tgl_kak, data.ppk_nama, data.ppk_nip];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error insert KAK:', err);
            return res.status(500).json({ success: false, message: 'Gagal menyimpan Kerangka Acuan Kerja' });
        }
        logController.catatLog(req, 'Buat KAK', `Membuat KAK Baru: ${data.judul_kegiatan}`);
        res.json({ success: true, message: 'KAK berhasil disimpan!', id: result.insertId });
    });
};
// ==========================================
// MENGAMBIL SEMUA DATA RIWAYAT KAK
// ==========================================
exports.getAllKak = (req, res) => {
    // NAH INI YANG KURANG MAS! Kita tambahkan subquery 'has_rab'
    const query = `
        SELECT k.*, p.nama_kamar,
        (SELECT COUNT(*) FROM dokumen_rab r WHERE r.kak_id = k.id) as has_rab
        FROM dokumen_kak k 
        LEFT JOIN pagu_anggaran p ON k.pagu_id = p.id 
        ORDER BY k.id DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetch riwayat KAK:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data riwayat KAK' });
        }
        res.json(results);
    });
};
// ==========================================
// MENGAMBIL 1 DATA KAK SPESIFIK UNTUK DICETAK
// ==========================================
exports.getKakById = (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT k.*, p.nama_kamar 
        FROM dokumen_kak k 
        LEFT JOIN pagu_anggaran p ON k.pagu_id = p.id 
        WHERE k.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetch KAK by ID:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data KAK' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Data KAK tidak ditemukan' });
        }
        res.json({ success: true, data: results[0] });
    });
};

// ==========================================
// MENGHAPUS DATA KAK (Hanya jika belum ada RAB)
// ==========================================
exports.deleteKak = (req, res) => {
    const kakId = req.params.id;
    const query = 'DELETE FROM dokumen_kak WHERE id = ?';

    db.query(query, [kakId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Gagal menghapus KAK.' });
        logController.catatLog(req, 'Hapus KAK', `Menghapus data KAK ID: ${kakId}`);
        res.json({ success: true, message: 'Data KAK berhasil dihapus!' });
    });
};

// ==========================================
// UPDATE DATA KAK
// ==========================================
exports.updateKak = (req, res) => {
    const kakId = req.params.id;
    const data = req.body;

    // PASTIKAN pagu_id ADA DI SINI ↓
    const query = `
        UPDATE dokumen_kak SET 
            pagu_id=?, judul_kegiatan=?, latar_belakang=?, dasar_hukum=?, 
            maksud_tujuan=?, output_kegiatan=?, tgl_kak=?, ppk_nama=?, ppk_nip=?
        WHERE id=?
    `;

    // PASTIKAN data.pagu_id BERADA DI URUTAN PERTAMA ↓
    const values = [data.pagu_id, data.judul_kegiatan, data.latar_belakang, data.dasar_hukum, data.maksud_tujuan, data.output_kegiatan, data.tgl_kak, data.ppk_nama, data.ppk_nip, kakId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error update KAK:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengupdate KAK.' });
        }
        logController.catatLog(req, 'Edit KAK', `Mengubah data KAK ID: ${kakId}`);
        res.json({ success: true, message: 'Data KAK berhasil diperbarui!' });
    });
};
