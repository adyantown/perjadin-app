const DashboardModel = require('../models/dashboardModel');

exports.getStats = async (req, res) => {
    try {
        const rows = await DashboardModel.getStats();
        const stats = rows[0];

        res.json({
            success: true,
            data: {
                total_sppd: stats.total_sppd,
                total_pegawai: stats.total_pegawai,
                total_spj_acc: stats.total_spj_acc,
                total_anggaran: Math.round(Number(stats.total_anggaran) || 0),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
