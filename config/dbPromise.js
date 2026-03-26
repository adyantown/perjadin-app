const db = require('./db');

/**
 * Promise wrapper untuk db.query().
 * Agar Model bisa menggunakan async/await tanpa callback hell.
 */
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

module.exports = { query };
