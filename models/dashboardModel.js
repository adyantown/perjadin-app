const db = require('../config/dbPromise');

exports.countSppd = () => {
    return db.query('SELECT COUNT(*) AS total FROM sppd_kpu');
};

exports.countPegawai = () => {
    return db.query('SELECT COUNT(*) AS total FROM master_pegawai');
};
