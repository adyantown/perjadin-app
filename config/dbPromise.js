const { promisePool } = require('./db');

/**
 * Promise wrapper menggunakan mysql2 native .promise() pool.
 * mysql2 pool.promise().query() mengembalikan [rows, fields].
 * Kita hanya kembalikan rows agar kompatibel dengan semua Model yang sudah ada.
 */
const query = async (sql, params) => {
    const [rows] = await promisePool.query(sql, params);
    return rows;
};

module.exports = { query };
