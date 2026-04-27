const db = require('../config/dbPromise');

exports.getStats = () => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM perjadin) AS total_sppd,
            (SELECT COUNT(*) FROM master_pegawai) AS total_pegawai,
            (SELECT COUNT(*) FROM dokumen_spj WHERE status = 'ACC') AS total_spj_acc,
            (SELECT COALESCE(SUM(total_biaya), 0) FROM perjadin) AS total_anggaran
    `;
    return db.query(sql);
};
