const db = require('../config/dbPromise');

exports.get = () => {
    return db.query('SELECT * FROM setting_pejabat WHERE id = 1');
};

exports.update = (data) => {
    return db.query('UPDATE setting_pejabat SET ? WHERE id = 1', data);
};
