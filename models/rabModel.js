const db = require('../config/dbPromise');

exports.getKandidatKak = () => {
    const sql = `
        SELECT k.id, k.judul_kegiatan, p.nama_kamar, p.pagu_awal, p.sisa_pagu
        FROM dokumen_kak k
        JOIN pagu_anggaran p ON k.pagu_id = p.id
        LEFT JOIN dokumen_rab r ON k.id = r.kak_id
        WHERE r.id IS NULL
        ORDER BY k.id DESC`;
    return db.query(sql);
};

exports.create = (data) => {
    const sql = `INSERT INTO dokumen_rab 
        (kak_id, snapshot_pagu, snapshot_realisasi, jml_orang, jml_hari, jml_kegiatan, 
        uang_harian_satuan, uang_harian_total, jenis_transport, transport_vol, 
        transport_satuan, transport_total, total_rab, tgl_rab) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        data.kak_id, data.snapshot_pagu, data.snapshot_realisasi, data.jml_orang,
        data.jml_hari, data.jml_kegiatan, data.uang_harian_satuan, data.uang_harian_total,
        data.jenis_transport, data.transport_vol, data.transport_satuan, data.transport_total,
        data.total_rab, data.tgl_rab
    ];
    return db.query(sql, values);
};

exports.deductPagu = (totalRab, kakId) => {
    const sql = `
        UPDATE pagu_anggaran 
        SET sisa_pagu = sisa_pagu - ? 
        WHERE id = (SELECT pagu_id FROM dokumen_kak WHERE id = ?)`;
    return db.query(sql, [totalRab, kakId]);
};

exports.getAll = () => {
    const sql = `
        SELECT r.*, k.judul_kegiatan, p.nama_kamar 
        FROM dokumen_rab r
        JOIN dokumen_kak k ON r.kak_id = k.id
        JOIN pagu_anggaran p ON k.pagu_id = p.id
        ORDER BY r.id DESC`;
    return db.query(sql);
};

exports.getById = (id) => {
    const sql = `
        SELECT r.*, k.judul_kegiatan, k.ppk_nama, k.ppk_nip, p.* FROM dokumen_rab r
        JOIN dokumen_kak k ON r.kak_id = k.id
        JOIN pagu_anggaran p ON k.pagu_id = p.id
        WHERE r.id = ?`;
    return db.query(sql, [id]);
};

exports.getRabForRefund = (id) => {
    const sql = `
        SELECT r.total_rab, k.pagu_id 
        FROM dokumen_rab r
        JOIN dokumen_kak k ON r.kak_id = k.id
        WHERE r.id = ?`;
    return db.query(sql, [id]);
};

exports.refundPagu = (amount, paguId) => {
    return db.query('UPDATE pagu_anggaran SET sisa_pagu = sisa_pagu + ? WHERE id = ?', [amount, paguId]);
};

exports.delete = (id) => {
    return db.query('DELETE FROM dokumen_rab WHERE id = ?', [id]);
};

exports.getSisaPagu = (paguId) => {
    return db.query('SELECT sisa_pagu FROM pagu_anggaran WHERE id = ?', [paguId]);
};

exports.adjustPagu = (selisih, paguId) => {
    return db.query('UPDATE pagu_anggaran SET sisa_pagu = sisa_pagu - ? WHERE id = ?', [selisih, paguId]);
};

exports.update = (id, data) => {
    const sql = `
        UPDATE dokumen_rab SET 
            jml_orang=?, jml_hari=?, jml_kegiatan=?, 
            uang_harian_satuan=?, uang_harian_total=?, 
            jenis_transport=?, transport_vol=?, transport_satuan=?, transport_total=?, 
            total_rab=? 
        WHERE id=?`;
    const values = [
        data.jml_orang, data.jml_hari, data.jml_kegiatan,
        data.uang_harian_satuan, data.uang_harian_total,
        data.jenis_transport, data.transport_vol, data.transport_satuan, data.transport_total,
        data.total_rab, id
    ];
    return db.query(sql, values);
};
