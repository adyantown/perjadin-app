const db = require('../config/dbPromise');

exports.getAll = () => {
    return db.query('SELECT * FROM pagu_anggaran');
};

exports.getById = (id) => {
    return db.query('SELECT pagu_awal, sisa_pagu FROM pagu_anggaran WHERE id = ?', [id]);
};

exports.updatePaguAndSisa = (id, paguBaru, sisaBaru) => {
    return db.query('UPDATE pagu_anggaran SET pagu_awal = ?, sisa_pagu = ? WHERE id = ?', [paguBaru, sisaBaru, id]);
};
