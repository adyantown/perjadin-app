const db = require('../config/dbPromise');

exports.create = (data) => {
    const sql = `
        INSERT INTO laporan_perjadin (
            perjadin_id, dasar_pelaksanaan, maksud_tujuan, materi_kegiatan, 
            tempat_pelaksanaan, waktu_pelaksanaan, hasil_pelaksanaan, foto_paths
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return db.query(sql, [
        data.perjadin_id,
        data.dasar_pelaksanaan,
        data.maksud_tujuan,
        data.materi_kegiatan,
        data.tempat_pelaksanaan,
        data.waktu_pelaksanaan,
        data.hasil_pelaksanaan,
        data.foto_paths || null
    ]);
};

exports.getByPerjadinId = (perjadinId) => {
    return db.query('SELECT * FROM laporan_perjadin WHERE perjadin_id = ? LIMIT 1', [perjadinId]);
};

// Check if a report exists for a perjadin_id
exports.exists = async (perjadinId) => {
    const rows = await db.query('SELECT id FROM laporan_perjadin WHERE perjadin_id = ? LIMIT 1', [perjadinId]);
    return rows.length > 0;
};

exports.getAll = () => {
    const sql = `
        SELECT l.*, p.no_surat_tugas, p.maksud_dinas, p.tgl_surat_tugas 
        FROM laporan_perjadin l 
        JOIN perjadin p ON l.perjadin_id = p.id 
        ORDER BY l.created_at DESC
    `;
    return db.query(sql);
};

exports.delete = (id) => {
    return db.query('DELETE FROM laporan_perjadin WHERE id = ?', [id]);
};
