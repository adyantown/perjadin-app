const db = require('../config/dbPromise');

// Cari ID perjadin berdasarkan nomor surat tugas
exports.getPerjadinIdByNomorSt = (nomorSt) => {
    return db.query('SELECT id FROM perjadin WHERE no_surat_tugas = ?', [nomorSt]);
};

// Cek SPJ yang sudah ada berdasarkan perjadin_id
exports.getExistingSpjByPerjadinId = (perjadinId) => {
    return db.query('SELECT id, perjadin_id FROM dokumen_spj WHERE perjadin_id = ?', [perjadinId]);
};

// Update file SPJ yang sudah ada (revisi upload)
exports.updateSpjFile = (filePdf, uploadedBy, perjadinId) => {
    const sql = `
        UPDATE dokumen_spj 
        SET file_pdf = ?, uploaded_by = ?, status = 'Menunggu Verifikasi', catatan_admin = NULL 
        WHERE perjadin_id = ?`;
    return db.query(sql, [filePdf, uploadedBy, perjadinId]);
};

// Insert SPJ baru
exports.insertSpj = (perjadinId, filePdf, uploadedBy) => {
    return db.query(
        'INSERT INTO dokumen_spj (perjadin_id, file_pdf, uploaded_by, status) VALUES (?, ?, ?, ?)',
        [perjadinId, filePdf, uploadedBy, 'Menunggu Verifikasi']
    );
};

// Ambil semua SPJ untuk admin (JOIN ke perjadin)
exports.getAllSpjWithPerjadin = () => {
    const sql = `
        SELECT doc.*, p.no_surat_tugas AS nomor_st, p.nama_pegawai, p.maksud_dinas, p.tgl_berangkat, p.tgl_pulang AS tgl_kembali
        FROM dokumen_spj doc
        JOIN perjadin p ON doc.perjadin_id = p.id
        ORDER BY doc.waktu_upload DESC`;
    return db.query(sql);
};

// Update status verifikasi SPJ
exports.updateSpjStatus = (id, status, catatanAdmin) => {
    return db.query('UPDATE dokumen_spj SET status = ?, catatan_admin = ? WHERE id = ?', [status, catatanAdmin, id]);
};

// Hapus SPJ
exports.deleteSpj = (id) => {
    return db.query('DELETE FROM dokumen_spj WHERE id = ?', [id]);
};

// Ambil nomor ST dari SPJ ID (untuk log)
exports.getNomorStBySpjId = (id) => {
    const sql = `
        SELECT p.no_surat_tugas AS nomor_st 
        FROM dokumen_spj doc
        JOIN perjadin p ON doc.perjadin_id = p.id
        WHERE doc.id = ?
    `;
    return db.query(sql, [id]);
};
