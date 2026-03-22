const db = require('../config/db');
const logController = require('./logController');

// ==========================================
// 1. UPLOAD FILE SPJ OLEH PEGAWAI
// ==========================================
exports.uploadSpj = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Wajib upload file PDF SPJ!' });
        }

        const nomor_st = req.body.nomor_st;
        const file_pdf = req.file.filename;

        // SSSHHH! Kita intip siapa yang lagi login dari session
        const uploaded_by = req.session.nama || 'Pegawai';

        // 1. Cari semua sppd_id yang punya nomor_st ini
        const getSppdQuery = 'SELECT id FROM sppd_kpu WHERE nomor_st = ?';
        db.query(getSppdQuery, [nomor_st], (err, sppdResults) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            
            if (sppdResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Surat Tugas tidak ditemukan!' });
            }

            // Ambil array ID saja
            const sppdIds = sppdResults.map(row => row.id);

            // 2. Cek mana yang udah punya SPJ, mana yang belum
            const checkSpjQuery = 'SELECT id, sppd_id FROM dokumen_spj WHERE sppd_id IN (?)';
            db.query(checkSpjQuery, [sppdIds], (err2, spjResults) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });

                const existingSppdIds = spjResults.map(row => row.sppd_id);
                
                // Pisahkan mana yang harus di-UPDATE (revisi), mana yang harus di-INSERT (baru)
                const toUpdateIds = [];
                const toInsertIds = [];

                sppdIds.forEach(id => {
                    if (existingSppdIds.includes(id)) {
                        toUpdateIds.push(id);
                    } else {
                        toInsertIds.push(id);
                    }
                });

                let pendingQueries = 0;
                let hasError = false;

                const finalize = () => {
                    if (pendingQueries === 0 && !hasError) {
                        logController.catatLog(req, 'Upload SPJ Rombongan', `Upload SPJ untuk Surat Tugas: ${nomor_st}`);
                        return res.json({ success: true, message: 'File SPJ Rombongan berhasil diupload dan menunggu verifikasi!' });
                    }
                };

                if (toUpdateIds.length > 0) {
                    pendingQueries++;
                    const updateQuery = `
                        UPDATE dokumen_spj 
                        SET file_pdf = ?, uploaded_by = ?, status = 'Menunggu Verifikasi', catatan_admin = NULL 
                        WHERE sppd_id IN (?)`;
                    db.query(updateQuery, [file_pdf, uploaded_by, toUpdateIds], (errU) => {
                        if (errU && !hasError) {
                            hasError = true;
                            return res.status(500).json({ success: false, message: errU.message });
                        }
                        pendingQueries--;
                        finalize();
                    });
                }

                if (toInsertIds.length > 0) {
                    pendingQueries++;
                    // Insert bulk
                    const values = toInsertIds.map(id => [id, file_pdf, uploaded_by, 'Menunggu Verifikasi']);
                    const insertQuery = `INSERT INTO dokumen_spj (sppd_id, file_pdf, uploaded_by, status) VALUES ?`;
                    db.query(insertQuery, [values], (errI) => {
                        if (errI && !hasError) {
                            hasError = true;
                            return res.status(500).json({ success: false, message: errI.message });
                        }
                        pendingQueries--;
                        finalize();
                    });
                }

                if (toUpdateIds.length === 0 && toInsertIds.length === 0) {
                    // Should not happen, but just in case
                    finalize();
                }
            });
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
        logController.catatLog(req, 'Verifikasi SPJ', `Mengubah status SPJ ID: ${spjId} menjadi ${status}`);
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
        logController.catatLog(req, 'Hapus SPJ', `Menghapus file SPJ ID: ${id}`);
        res.json({ success: true, message: 'Data SPJ berhasil dihapus!' });
    });
};
