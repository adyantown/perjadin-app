const db = require('../config/dbPromise');
const { promisePool } = require('../config/db');
const DokumentasiModel = require('./dokumentasiModel');

exports.insert = (params) => {
    const sql = `INSERT INTO perjadin (
        no_surat_tugas, tgl_surat_tugas, menimbang, dasar,
        nama_pegawai, golongan, jabatan, 
        jumlah_sppd, tujuan, maksud_dinas, uraian_tugas, tgl_berangkat, tgl_pulang, 
        uang_harian, ket_harian, jenis_transportasi, biaya_transportasi,
        biaya_bbm, ket_bbm, biaya_tol, ket_tol, biaya_tiket, ket_tiket, biaya_parkir, ket_parkir,
        nama_hotel, pembayar_hotel, tarif_hotel, tgl_checkin, tgl_checkout, total_biaya
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    return db.query(sql, params);
};

const updateSql = `UPDATE perjadin SET
    no_surat_tugas=?, tgl_surat_tugas=?, menimbang=?, dasar=?,
    nama_pegawai=?, golongan=?, jabatan=?,
    jumlah_sppd=?, tujuan=?, maksud_dinas=?, uraian_tugas=?, tgl_berangkat=?, tgl_pulang=?,
    uang_harian=?, ket_harian=?, jenis_transportasi=?, biaya_transportasi=?,
    biaya_bbm=?, ket_bbm=?, biaya_tol=?, ket_tol=?, biaya_tiket=?, ket_tiket=?, biaya_parkir=?, ket_parkir=?,
    nama_hotel=?, pembayar_hotel=?, tarif_hotel=?, tgl_checkin=?, tgl_checkout=?, total_biaya=?
    WHERE id=?`;

exports.update = (id, params) => {
    return db.query(updateSql, [...params, id]);
};

exports.updateAndInvalidateSpj = async (id, params, pegawaiIdArray = [], kuitansiArray = []) => {
    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();
        const [updateResult] = await connection.execute(updateSql, [...params, id]);
        const [existingPivotRows] = await connection.execute(
            'SELECT pegawai_id, total_kuitansi FROM perjadin_pegawai WHERE perjadin_id = ? FOR UPDATE',
            [id],
        );
        const desiredPivotRows = pegawaiIdArray
            .map((rawId, index) => ({
                pegawaiId: parseInt(rawId, 10),
                totalKuitansi: Number(kuitansiArray[index] || 0),
            }))
            .filter((row) => row.pegawaiId > 0 && Number.isFinite(row.pegawaiId));
        const sortPivotRows = (rows) => rows
            .map((row) => ({
                pegawaiId: Number(row.pegawaiId ?? row.pegawai_id),
                totalKuitansi: Number(row.totalKuitansi ?? row.total_kuitansi),
            }))
            .sort((a, b) => a.pegawaiId - b.pegawaiId || a.totalKuitansi - b.totalKuitansi);
        const pivotChanged = JSON.stringify(sortPivotRows(existingPivotRows))
            !== JSON.stringify(sortPivotRows(desiredPivotRows));
        const dataChanged = updateResult.changedRows > 0 || pivotChanged;

        if (pivotChanged) {
            await connection.execute('DELETE FROM perjadin_pegawai WHERE perjadin_id = ?', [id]);
            for (const row of desiredPivotRows) {
                await connection.execute(
                    'INSERT INTO perjadin_pegawai (perjadin_id, pegawai_id, total_kuitansi) VALUES (?, ?, ?)',
                    [id, row.pegawaiId, row.totalKuitansi],
                );
            }
        }

        const [spjRows] = await connection.execute(
            'SELECT id FROM dokumen_spj WHERE perjadin_id = ? FOR UPDATE',
            [id],
        );

        if (dataChanged && spjRows.length > 0) {
            await connection.execute(
                `UPDATE dokumen_spj
                SET status = 'Revisi', catatan_admin = ?
                WHERE perjadin_id = ?`,
                [DokumentasiModel.SPJ_PERJADIN_CHANGED_NOTE, id],
            );
        }

        if (dataChanged) {
            await connection.execute('UPDATE perjadin SET status_spj = 0 WHERE id = ?', [id]);
        }
        await connection.commit();

        return dataChanged && spjRows.length > 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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

exports.insertPivot = (perjadinId, pegawaiId, totalKuitansi = 0) => {
    return db.query('INSERT INTO perjadin_pegawai (perjadin_id, pegawai_id, total_kuitansi) VALUES (?, ?, ?)', [perjadinId, pegawaiId, totalKuitansi]);
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
        SELECT p.*, pp.total_kuitansi FROM perjadin p
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
            COALESCE(SUM(pp.total_kuitansi), 0) AS total_anggaran
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
            uang_harian, ket_harian,
            biaya_transportasi AS uang_transport,
            biaya_bbm, ket_bbm,
            biaya_tol, ket_tol,
            biaya_tiket, ket_tiket,
            biaya_parkir, ket_parkir,
            nama_hotel, pembayar_hotel,
            tarif_hotel AS uang_penginapan,
            tgl_checkin, tgl_checkout
        FROM perjadin 
        WHERE id = ?
    `;
    return db.query(sql, [id]);
};
