const db = require('../config/dbPromise');

exports.getSppdIdsByNomorSt = (nomorSt) => {
    return db.query('SELECT id FROM sppd_kpu WHERE nomor_st = ?', [nomorSt]);
};

exports.getExistingSpjBySppdIds = (sppdIds) => {
    return db.query('SELECT id, sppd_id FROM dokumen_spj WHERE sppd_id IN (?)', [sppdIds]);
};

exports.updateSpjFiles = (filePdf, uploadedBy, sppdIds) => {
    const sql = `
        UPDATE dokumen_spj 
        SET file_pdf = ?, uploaded_by = ?, status = 'Menunggu Verifikasi', catatan_admin = NULL 
        WHERE sppd_id IN (?)`;
    return db.query(sql, [filePdf, uploadedBy, sppdIds]);
};

exports.insertSpjBulk = (values) => {
    return db.query('INSERT INTO dokumen_spj (sppd_id, file_pdf, uploaded_by, status) VALUES ?', [values]);
};

exports.getAllSpjWithSppd = () => {
    const sql = `
        SELECT doc.*, s.nomor_st, s.nama_pegawai, s.maksud_dinas, s.tgl_berangkat, s.tgl_kembali 
        FROM dokumen_spj doc
        JOIN sppd_kpu s ON doc.sppd_id = s.id
        ORDER BY doc.waktu_upload DESC`;
    return db.query(sql);
};

exports.updateSpjStatus = (id, status, catatanAdmin) => {
    return db.query('UPDATE dokumen_spj SET status = ?, catatan_admin = ? WHERE id = ?', [status, catatanAdmin, id]);
};

exports.deleteSpj = (id) => {
    return db.query('DELETE FROM dokumen_spj WHERE id = ?', [id]);
};

exports.getNomorStBySpjId = (id) => {
    const sql = `
        SELECT s.nomor_st 
        FROM dokumen_spj doc
        JOIN sppd_kpu s ON doc.sppd_id = s.id
        WHERE doc.id = ?
    `;
    return db.query(sql, [id]);
};
