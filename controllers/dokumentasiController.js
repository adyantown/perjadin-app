// controllers/dokumentasiController.js
const db = require('../config/db');

// ==========================================
// 1. UPLOAD FILE SPJ OLEH PEGAWAI
// ==========================================
exports.uploadSpj = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Wajib upload file PDF SPJ!' });
        }

        const sppd_id = req.body.sppd_id;
        const file_pdf = req.file.filename;

        // SSSHHH! Kita intip siapa yang lagi login dari session
        const uploaded_by = req.session.nama || 'Pegawai';

        // Cek dulu, apakah SPPD ini sebelumnya udah pernah di-upload SPJ-nya?
        const checkQuery = 'SELECT id FROM dokumen_spj WHERE sppd_id = ?';
        db.query(checkQuery, [sppd_id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: err.message });

            if (results.length > 0) {
                // Kalau udah ada (misal lagi proses revisi), UPDATE file dan catat siapa yang revisi
                const updateQuery = `
                    UPDATE dokumen_spj 
                    SET file_pdf = ?, uploaded_by = ?, status = 'Menunggu Verifikasi', catatan_admin = NULL 
                    WHERE sppd_id = ?`;
                db.query(updateQuery, [file_pdf, uploaded_by, sppd_id], (err2) => {
                    if (err2) return res.status(500).json({ success: false, message: err2.message });
                    res.json({ success: true, message: 'File Revisi SPJ berhasil diupload!' });
                });
            } else {
                // Kalau belum pernah, kita INSERT data baru beserta nama penguploadnya
                const insertQuery = `INSERT INTO dokumen_spj (sppd_id, file_pdf, uploaded_by, status) VALUES (?, ?, ?, 'Menunggu Verifikasi')`;
                db.query(insertQuery, [sppd_id, file_pdf, uploaded_by], (err3) => {
                    if (err3) return res.status(500).json({ success: false, message: err3.message });
                    res.json({ success: true, message: 'File SPJ berhasil diupload dan menunggu verifikasi!' });
                });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. AMBIL SEMUA ANTREAN SPJ (UNTUK ADMIN)
// ==========================================
exports.getAllSpj = (req, res) => {
    // Kita JOIN ke tabel sppd_kpu biar admin tau ini SPJ-nya siapa & kegiatan apa
    const sql = `
        SELECT doc.*, s.nama_pegawai, s.maksud_dinas, s.tgl_berangkat, s.tgl_kembali 
        FROM dokumen_spj doc
        JOIN sppd_kpu s ON doc.sppd_id = s.id
        ORDER BY doc.waktu_upload DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
};

// ==========================================
// 3. PROSES VERIFIKASI (ACC / REVISI OLEH ADMIN)
// ==========================================
exports.verifikasiSpj = (req, res) => {
    const spjId = req.params.id;
    const { status, catatan_admin } = req.body;
    // status isinya bisa 'ACC' atau 'Revisi'

    const sql = `UPDATE dokumen_spj SET status = ?, catatan_admin = ? WHERE id = ?`;

    db.query(sql, [status, catatan_admin, spjId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: `SPJ berhasil di-set menjadi: ${status}` });
    });
};

// ==========================================
// 4. HAPUS SPJ (OPSIONAL)
// ==========================================
exports.deleteSpj = (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM dokumen_spj WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Data SPJ berhasil dihapus!' });
    });
};
