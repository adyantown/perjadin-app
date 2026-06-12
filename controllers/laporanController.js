const LaporanModel = require('../models/laporanModel');
const PerjadinModel = require('../models/perjadinModel');
const logController = require('./logController');
const fs = require('fs');
const path = require('path');

exports.saveLaporan = async (req, res) => {
    try {
        const {
            perjadin_id, dasar_pelaksanaan, maksud_tujuan, materi_kegiatan,
            tempat_pelaksanaan, waktu_pelaksanaan, hasil_pelaksanaan
        } = req.body;

        if (!perjadin_id) {
            return res.status(400).json({ success: false, message: 'ID Perjalanan Dinas wajib dipilih!' });
        }

        // Cek apakah laporan untuk SPPD ini sudah ada
        const exists = await LaporanModel.exists(perjadin_id);
        if (exists) {
            return res.status(400).json({ success: false, message: 'Laporan untuk perjalanan dinas ini sudah pernah dibuat!' });
        }

        // Proses foto jika ada
        let fotoPaths = '';
        if (req.files && req.files.length > 0) {
            // Gabungkan URL Cloudinary (tersedia di file.path) dengan koma
            fotoPaths = req.files.map(file => file.path).join(',');
        }

        const data = {
            perjadin_id,
            dasar_pelaksanaan,
            maksud_tujuan,
            materi_kegiatan,
            tempat_pelaksanaan,
            waktu_pelaksanaan,
            hasil_pelaksanaan,
            foto_paths: fotoPaths
        };

        const result = await LaporanModel.create(data);
        logController.catatLog(req, 'Buat Laporan', `Membuat Laporan Kegiatan: ${maksud_tujuan}`);
        res.json({ success: true, message: 'Laporan berhasil disimpan!', id: result.insertId });

    } catch (err) {
        console.error('Error save laporan:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat menyimpan laporan.' });
    }
};

exports.getLaporan = async (req, res) => {
    try {
        const perjadinId = req.params.perjadinId;
        const results = await LaporanModel.getByPerjadinId(perjadinId);
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Data laporan tidak ditemukan.' });
        }

        res.json({ success: true, data: results[0] });
    } catch (err) {
        console.error('Error get laporan:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data laporan.' });
    }
};

exports.getAvailablePerjadin = async (req, res) => {
    try {
        // Ambil semua perjadin
        const semuaPerjadin = await PerjadinModel.getAll();
        
        // Cek id mana saja yang belum punya laporan
        // Untuk optimasi, idealnya query JOIN, tapi karena data sedikit kita loop atau query WHERE NOT IN
        // Query cepat: SELECT p.id, p.no_surat_tugas, p.maksud_dinas FROM perjadin p LEFT JOIN laporan_perjadin l ON p.id = l.perjadin_id WHERE l.id IS NULL
        const db = require('../config/dbPromise');
        const sql = `
            SELECT p.id, p.no_surat_tugas, p.maksud_dinas, p.tgl_surat_tugas, p.tujuan, p.tgl_berangkat, p.tgl_pulang
            FROM perjadin p 
            LEFT JOIN laporan_perjadin l ON p.id = l.perjadin_id 
            WHERE l.id IS NULL
            ORDER BY p.id DESC
        `;
        const rows = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetch available perjadin:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar SPPD.' });
    }
};

exports.getAllLaporan = async (req, res) => {
    try {
        const results = await LaporanModel.getAll();
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error get all laporan:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data daftar laporan.' });
    }
};

exports.deleteLaporan = async (req, res) => {
    try {
        const id = req.params.id;
        await LaporanModel.delete(id);
        logController.catatLog(req, 'Hapus Laporan', `Menghapus Laporan Kegiatan dengan ID: ${id}`);
        res.json({ success: true, message: 'Data laporan berhasil dihapus!' });
    } catch (err) {
        console.error('Error delete laporan:', err);
        res.status(500).json({ success: false, message: 'Gagal menghapus data laporan.' });
    }
};
