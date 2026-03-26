const db = require('../config/dbPromise');

exports.getAllPagu = () => {
    return db.query('SELECT id, nama_kamar, sisa_pagu FROM pagu_anggaran ORDER BY id ASC');
};

exports.create = (data) => {
    const sql = `INSERT INTO dokumen_kak 
        (pagu_id, judul_kegiatan, latar_belakang, dasar_hukum, maksud_tujuan, output_kegiatan, tgl_kak, ppk_nama, ppk_nip, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`;
    const values = [
        data.pagu_id, data.judul_kegiatan, data.latar_belakang, data.dasar_hukum,
        data.maksud_tujuan, data.output_kegiatan, data.tgl_kak, data.ppk_nama, data.ppk_nip
    ];
    return db.query(sql, values);
};

exports.getAll = () => {
    const sql = `
        SELECT k.*, p.nama_kamar,
        (SELECT COUNT(*) FROM dokumen_rab r WHERE r.kak_id = k.id) as has_rab
        FROM dokumen_kak k 
        LEFT JOIN pagu_anggaran p ON k.pagu_id = p.id 
        ORDER BY k.id DESC`;
    return db.query(sql);
};

exports.getById = (id) => {
    const sql = `
        SELECT k.*, p.nama_kamar 
        FROM dokumen_kak k 
        LEFT JOIN pagu_anggaran p ON k.pagu_id = p.id 
        WHERE k.id = ?`;
    return db.query(sql, [id]);
};

exports.delete = (id) => {
    return db.query('DELETE FROM dokumen_kak WHERE id = ?', [id]);
};

exports.update = (id, data) => {
    const sql = `
        UPDATE dokumen_kak SET 
            pagu_id=?, judul_kegiatan=?, latar_belakang=?, dasar_hukum=?, 
            maksud_tujuan=?, output_kegiatan=?, tgl_kak=?, ppk_nama=?, ppk_nip=?
        WHERE id=?`;
    const values = [
        data.pagu_id, data.judul_kegiatan, data.latar_belakang, data.dasar_hukum,
        data.maksud_tujuan, data.output_kegiatan, data.tgl_kak, data.ppk_nama, data.ppk_nip, id
    ];
    return db.query(sql, values);
};
