const db = require('../config/dbPromise');

exports.getAll = () => {
    return db.query('SELECT id, username, nama_lengkap, role FROM users ORDER BY id DESC');
};

exports.create = (username, hashedPassword, namaLengkap, role) => {
    return db.query(
        'INSERT INTO users (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, namaLengkap, role]
    );
};

exports.updatePassword = (id, hashedPassword) => {
    return db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
};

exports.delete = (id) => {
    return db.query('DELETE FROM users WHERE id = ?', [id]);
};
