// controllers/dokumentasiController.js
const db = require('../config/db');
const logController = require('./logController');
// 1. Simpan Bukti & Lokasi
exports.uploadBukti = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Wajib upload foto bukti!' });
        }

        const { id_sppd, latitude, longitude, keterangan } = req.body;
        const foto = req.file.filename;

        // Ambil nama user dari session (Auto-detect siapa yang login)
        const pengupload = req.session.nama || 'User';

        const sql = `INSERT INTO dokumentasi_sppd 
                     (id_sppd, uploaded_by, foto_path, latitude, longitude, keterangan) 
                     VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(sql, [id_sppd, pengupload, foto, latitude, longitude, keterangan], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Laporan kegiatan berhasil dikirim!' });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Ambil Semua Data (Untuk Galeri Admin)
exports.getAllGaleri = (req, res) => {
    // Join tabel SPPD biar kita tau ini foto kegiatan apa & kemana
    const sql = `
        SELECT doc.*, sppd.maksud_dinas, sppd.tempat_tujuan, sppd.nomor_st 
        FROM dokumentasi_sppd doc
        JOIN sppd_kpu sppd ON doc.id_sppd = sppd.id
        ORDER BY doc.created_at DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
};

// 3. FUNGSI HAPUS DOKUMENTASI (BARU)
exports.deleteDokumentasi = (req, res) => {
    const id = req.params.id;

    // Hapus data dari database berdasarkan ID
    const sql = 'DELETE FROM dokumentasi_sppd WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error hapus foto:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Dokumentasi berhasil dihapus!' });
    });
};
