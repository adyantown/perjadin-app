const db = require('../config/dbPromise');

exports.getAll = () => {
    return db.query(`SELECT * FROM master_pegawai ORDER BY FIELD(kategori, 'Komisioner', 'PNS', 'PPPK'), nama_pegawai ASC`);
};

exports.getById = (id) => {
    return db.query('SELECT * FROM master_pegawai WHERE id = ?', [id]);
};

exports.create = (data) => {
    return db.query('INSERT INTO master_pegawai SET ?', data);
};

exports.update = (id, data) => {
    return db.query('UPDATE master_pegawai SET ? WHERE id = ?', [data, id]);
};

exports.delete = (id) => {
    return db.query('DELETE FROM master_pegawai WHERE id = ?', [id]);
};

exports.getByKategori = (kategori) => {
    return db.query('SELECT * FROM master_pegawai WHERE kategori = ? ORDER BY nama_pegawai ASC', [kategori]);
};
