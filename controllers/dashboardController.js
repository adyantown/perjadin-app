const db = require('../config/db');

exports.getStats = (req, res) => {
    // Kita jalankan 2 query sekaligus (Parallel) biar cepat
    const querySPPD = 'SELECT COUNT(*) AS total FROM sppd_kpu';
    const queryPegawai = 'SELECT COUNT(*) AS total FROM master_pegawai';

    db.query(querySPPD, (err, resSPPD) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(queryPegawai, (err2, resPegawai) => {
            if (err2) return res.status(500).json({ error: err2.message });

            // Kirim hasil perhitungan ke frontend
            res.json({
                success: true,
                data: {
                    total_sppd: resSPPD[0].total,
                    total_pegawai: resPegawai[0].total,
                },
            });
        });
    });
};
