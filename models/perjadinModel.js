const db = require('../config/dbPromise');

exports.insert = (params) => {
    const sql = `INSERT INTO perjadin (
        no_surat_tugas, tgl_surat_tugas, nama_pegawai, golongan, jabatan, 
        jumlah_sppd, tujuan, maksud_dinas, tgl_berangkat, tgl_pulang, 
        uang_harian, jenis_transportasi, biaya_transportasi, nama_hotel, 
        tarif_hotel, tgl_checkin, tgl_checkout, total_biaya
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    return db.query(sql, params);
};

exports.update = (id, params) => {
    const sql = `UPDATE perjadin SET 
        no_surat_tugas=?, tgl_surat_tugas=?, nama_pegawai=?, golongan=?, jabatan=?, 
        jumlah_sppd=?, tujuan=?, maksud_dinas=?, tgl_berangkat=?, tgl_pulang=?, 
        uang_harian=?, jenis_transportasi=?, biaya_transportasi=?, nama_hotel=?, 
        tarif_hotel=?, tgl_checkin=?, tgl_checkout=?, total_biaya=? 
        WHERE id=?`;
    return db.query(sql, [...params, id]);
};

exports.getAll = () => {
    return db.query('SELECT * FROM perjadin ORDER BY id DESC');
};

exports.getById = (id) => {
    return db.query('SELECT * FROM perjadin WHERE id = ?', [id]);
};

exports.delete = (id) => {
    return db.query('DELETE FROM perjadin WHERE id = ?', [id]);
};

exports.findPegawaiByNama = (nama) => {
    return db.query('SELECT id FROM master_pegawai WHERE nama_pegawai LIKE ? LIMIT 1', [`%${nama}%`]);
};

exports.deletePivot = (perjadinId) => {
    return db.query('DELETE FROM perjadin_pegawai WHERE perjadin_id = ?', [perjadinId]);
};

exports.insertPivot = (perjadinId, pegawaiId) => {
    return db.query('INSERT INTO perjadin_pegawai (perjadin_id, pegawai_id) VALUES (?, ?)', [perjadinId, pegawaiId]);
};

exports.getAnalitikByPegawai = (pegawaiId) => {
    const sql = `
        SELECT p.* FROM perjadin p
        JOIN perjadin_pegawai pp ON p.id = pp.perjadin_id
        WHERE pp.pegawai_id = ?
        ORDER BY p.tgl_berangkat ASC`;
    return db.query(sql, [pegawaiId]);
};
