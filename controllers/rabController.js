// controllers/rabController.js
const RabModel = require('../models/rabModel');
const logController = require('./logController');

// ==========================================
// 1. AMBIL KAK YANG BELUM PUNYA RAB
// ==========================================
exports.getKandidatKak = async (req, res) => {
    try {
        // Kita filter: Hanya KAK yang belum ada di tabel dokumen_rab yang muncul!
        const results = await RabModel.getKandidatKak();
        res.json(results);
    } catch (err) {
        console.error('Error fetch KAK Kandidat:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data KAK' });
    }
};

// ==========================================
// 2. SIMPAN RAB & POTONG SALDO PAGU
// ==========================================
exports.saveRab = async (req, res) => {
    try {
        const data = req.body;

        // A. Masukkan data ke tabel dokumen_rab
        await RabModel.create(data);

        // B. POTONG SISA SALDO DI TABEL PAGU ANGGARAN (The Magic!)
        try {
            await RabModel.deductPagu(data.total_rab, data.kak_id);
        } catch (err2) {
            console.error('Gagal memotong saldo pagu:', err2);
        }

        // Tetap kita anggap sukses karena RAB-nya berhasil dibuat
        logController.catatLog(req, 'Buat RAB', `Membuat RAB untuk KAK ID: ${data.kak_id}`);
        res.json({ success: true, message: 'RAB Berhasil Disimpan & Saldo Terpotong!' });
    } catch (err) {
        console.error('Error insert RAB:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan RAB' });
    }
};

// ==========================================
// 3. AMBIL SEMUA RIWAYAT RAB (Untuk Tabel)
// ==========================================
exports.getAllRab = async (req, res) => {
    try {
        // Kita JOIN ke tabel KAK dan PAGU biar judul kegiatan dan nama kamarnya kebawa
        const results = await RabModel.getAll();
        res.json(results);
    } catch (err) {
        console.error('Error fetch Riwayat RAB:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data riwayat RAB' });
    }
};

// ==========================================
// 4. AMBIL 1 DATA RAB SPESIFIK UNTUK DICETAK
// ==========================================
exports.getRabById = async (req, res) => {
    try {
        const id = req.params.id;
        const results = await RabModel.getById(id);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Data RAB tidak ditemukan' });
        }
        res.json({ success: true, data: results[0] });
    } catch (err) {
        console.error('Error fetch RAB by ID:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data RAB' });
    }
};

// ==========================================
// 5. HAPUS RAB DAN KEMBALIKAN SALDO PAGU (REFUND)
// ==========================================
exports.deleteRab = async (req, res) => {
    try {
        const rabId = req.params.id;

        // A. Cari dulu data RAB-nya untuk tahu berapa uang yang harus di-refund
        const results = await RabModel.getRabForRefund(rabId);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Data RAB tidak ditemukan.' });
        }

        const uangRefund = results[0].total_rab;
        const paguId = results[0].pagu_id;

        // B. Kembalikan uang ke Brankas (Sihir Refund!)
        await RabModel.refundPagu(uangRefund, paguId);

        // C. Setelah uang aman dikembalikan, barulah HAPUS data RAB-nya!
        await RabModel.delete(rabId);

        logController.catatLog(req, 'Hapus RAB', `Menghapus data RAB ID: ${rabId}`);
        res.json({ success: true, message: 'RAB dibatalkan dan Saldo berhasil dikembalikan ke Brankas!' });
    } catch (err) {
        console.error('Error proses hapus RAB:', err);
        res.status(500).json({ success: false, message: 'Gagal memproses penghapusan.' });
    }
};

// ==========================================
// 6. UPDATE RAB & HITUNG SELISIH SALDO PAGU
// ==========================================
exports.updateRab = async (req, res) => {
    try {
        const rabId = req.params.id;
        const data = req.body;

        // A. Ambil data RAB lama
        const results = await RabModel.getRabForRefund(rabId);

        if (results.length === 0) {
            return res.status(500).json({ success: false, message: 'Gagal mencari data RAB lama.' });
        }

        const oldTotal = parseFloat(results[0].total_rab);
        const newTotal = parseFloat(data.total_rab);
        const paguId = results[0].pagu_id;

        // B. Hitung Selisih (Total Baru - Total Lama)
        const selisih = newTotal - oldTotal;

        // C. Cek Saldo Brankas (Kalau revisinya bikin biaya nambah, duitnya cukup gak?)
        const paguRes = await RabModel.getSisaPagu(paguId);

        // JIKA selisih positif (nambah biaya) dan uang di pagu kurang
        if (selisih > 0 && paguRes[0].sisa_pagu < selisih) {
            return res.status(400).json({ success: false, message: 'Revisi ditolak! Saldo Pagu tidak mencukupi untuk penambahan biaya.' });
        }

        // D. Sesuaikan Saldo Brankas (Sisa Pagu - Selisih)
        await RabModel.adjustPagu(selisih, paguId);

        // E. Simpan Rincian RAB yang Baru ke Database
        await RabModel.update(rabId, data);

        logController.catatLog(req, 'Edit RAB', `Mengubah data RAB ID: ${rabId}`);
        res.json({ success: true, message: 'Revisi berhasil disimpan dan Saldo Pagu otomatis disesuaikan!' });
    } catch (err) {
        console.error('Error update RAB:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan revisi RAB.' });
    }
};
