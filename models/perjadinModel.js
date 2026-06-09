const db = require('../config/dbPromise');

exports.insert = (params) => {
    const sql = `INSERT INTO perjadin (
        no_surat_tugas, tgl_surat_tugas, menimbang, dasar,
        nama_pegawai, golongan, jabatan, 
        jumlah_sppd, tujuan, maksud_dinas, uraian_tugas, tgl_berangkat, tgl_pulang, 
        uang_harian, jenis_transportasi, biaya_transportasi, nama_hotel, 
        tarif_hotel, tgl_checkin, tgl_checkout, total_biaya
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    return db.query(sql, params);
};

exports.update = (id, params) => {
    const sql = `UPDATE perjadin SET 
        no_surat_tugas=?, tgl_surat_tugas=?, menimbang=?, dasar=?,
        nama_pegawai=?, golongan=?, jabatan=?, 
        jumlah_sppd=?, tujuan=?, maksud_dinas=?, uraian_tugas=?, tgl_berangkat=?, tgl_pulang=?, 
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

exports.getPegawaiByPerjadinId = (perjadinId) => {
    const sql = `
        SELECT mp.id, mp.nama_pegawai, mp.nip_nik AS nip, 
               mp.pangkat, mp.golongan, mp.jabatan
        FROM perjadin_pegawai pp
        JOIN master_pegawai mp ON pp.pegawai_id = mp.id
        WHERE pp.perjadin_id = ?
        ORDER BY pp.id ASC`;
    return db.query(sql, [perjadinId]);
};

exports.getAnalitikByPegawai = (pegawaiId) => {
    const sql = `
        SELECT p.* FROM perjadin p
        JOIN perjadin_pegawai pp ON p.id = pp.perjadin_id
        WHERE pp.pegawai_id = ?
        ORDER BY p.tgl_berangkat ASC`;
    return db.query(sql, [pegawaiId]);
};

exports.getRankingPegawai = () => {
    const sql = `
        SELECT 
            mp.id,
            mp.nama_pegawai,
            mp.kategori,
            mp.jabatan,
            COUNT(pp.perjadin_id) AS total_perjadin,
            COALESCE(SUM(p.total_biaya / p.jumlah_sppd), 0) AS total_anggaran
        FROM master_pegawai mp
        LEFT JOIN perjadin_pegawai pp ON mp.id = pp.pegawai_id
        LEFT JOIN perjadin p ON pp.perjadin_id = p.id
        GROUP BY mp.id, mp.nama_pegawai, mp.kategori, mp.jabatan
        ORDER BY total_perjadin DESC, mp.nama_pegawai ASC`;
    return db.query(sql);
};

exports.updateStatusSpj = (noSuratTugas, status) => {
    return db.query('UPDATE perjadin SET status_spj = ? WHERE no_surat_tugas = ?', [status, noSuratTugas]);
};

exports.getKuitansiData = (id) => {
    // Kita panggil langsung nama kolom asli dari tabel perjadin Mas Ady
    const sql = `
        SELECT 
            id,
            no_surat_tugas, 
            tgl_surat_tugas,
            menimbang,
            dasar,
            tujuan,
            maksud_dinas, 
            uraian_tugas,
            nama_pegawai, 
            golongan, 
            jabatan,
            jenis_transportasi,
            tgl_berangkat,
            tgl_pulang,
            (DATEDIFF(tgl_pulang, tgl_berangkat) + 1) AS lama_hari,
            uang_harian, 
            biaya_transportasi AS uang_transport, 
            tarif_hotel AS uang_penginapan
        FROM perjadin 
        WHERE id = ?
    `;
    return db.query(sql, [id]);
};
