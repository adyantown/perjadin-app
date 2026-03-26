const db = require('../config/dbPromise');

exports.create = (data) => {
    return db.query('INSERT INTO sppd_kpu SET ?', data);
};

exports.getAll = () => {
    return db.query('SELECT * FROM sppd_kpu ORDER BY id DESC');
};

exports.getById = (id) => {
    return db.query('SELECT * FROM sppd_kpu WHERE id = ?', [id]);
};

exports.update = (id, data) => {
    return db.query('UPDATE sppd_kpu SET ? WHERE id = ?', [data, id]);
};

exports.delete = (id) => {
    return db.query('DELETE FROM sppd_kpu WHERE id = ?', [id]);
};
