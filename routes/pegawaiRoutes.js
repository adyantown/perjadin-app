const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController'); // CONTROLLER

// --- 1. API UTAMA (Pakai Controller) ---

// Ambil Semua Data (Untuk Dropdown di Form SPPD & Tabel Database)
router.get('/data/all', pegawaiController.getAllPegawai);

// Ambil Satu Data Detail (Untuk Edit)
router.get('/detail/:id', pegawaiController.getPegawaiById);

// Simpan, Update, Hapus
router.post('/save', pegawaiController.createPegawai);
router.put('/update/:id', pegawaiController.updatePegawai);
router.delete('/delete/:id', pegawaiController.deletePegawai);

// --- 2. API KHUSUS FILTER (Untuk Radio Button PNS/PPPK/Komisioner) ---
// Route ini menangkap request seperti: /api/pegawai/PNS
router.get('/:kategori', pegawaiController.getPegawaiByKategori);

module.exports = router;
