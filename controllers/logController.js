const LogModel = require('../models/logModel');

// 1. FUNGSI HELPER: Untuk mencatat aktivitas (Bisa dipanggil dari mana saja)
exports.catatLog = (req, aksi, keterangan) => {
    // Ambil data user dari sesi (kalau belum login, tulis 'Sistem' atau 'Anonim')
    const namaUser = req.session.nama || 'Sistem / Anonim';
    const roleUser = req.session.role || 'unknown';

    // Fire-and-forget: kita tidak perlu await karena log tidak boleh block response
    LogModel.insertLog(namaUser, roleUser, aksi, keterangan).catch((err) => {
        console.error('Gagal mencatat log CCTV:', err.message);
    });
};

// 2. FUNGSI GET: Untuk mengambil data log ke Halaman Admin
exports.getLogs = async (req, res) => {
    try {
        // Ambil 100 aktivitas terbaru saja biar server tidak berat
        const rows = await LogModel.getRecentLogs(100);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
