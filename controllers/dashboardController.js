const DashboardModel = require('../models/dashboardModel');

exports.getStats = async (req, res) => {
    try {
        // Kita jalankan 2 query sekaligus (Parallel) biar cepat
        const [resSPPD, resPegawai] = await Promise.all([
            DashboardModel.countSppd(),
            DashboardModel.countPegawai()
        ]);

        // Kirim hasil perhitungan ke frontend
        res.json({
            success: true,
            data: {
                total_sppd: resSPPD[0].total,
                total_pegawai: resPegawai[0].total,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
