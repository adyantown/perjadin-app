const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

const db = new sqlite3.Database('./perjadin.db');

// Inisialisasi Tabel Perjadin dengan kolom kompleks
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS perjadin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no_surat_tugas TEXT,
        tgl_surat_tugas TEXT,
        nama_pegawai TEXT,
        golongan TEXT,
        jabatan TEXT,
        jumlah_sppd INTEGER,
        tujuan TEXT,
        maksud_dinas TEXT,
        tgl_berangkat TEXT,
        tgl_pulang TEXT,
        uang_harian REAL,
        jenis_transportasi TEXT,
        biaya_transportasi REAL,
        nama_hotel TEXT,
        tarif_hotel REAL,
        tgl_checkin TEXT,
        tgl_checkout TEXT,
        total_biaya REAL
    )`);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Endpoint untuk menyimpan data
app.post('/api/save-perjadin', (req, res) => {
    const d = req.body;

    // Hitung jumlah pegawai dari array input
    const namaPegawaiArray = Array.isArray(d['nama_pegawai[]']) ? d['nama_pegawai[]'] : [d['nama_pegawai[]']];
    const jumlahPegawai = namaPegawaiArray.length;

    // Logika Tanggal
    const tgl1 = new Date(d.tgl_berangkat);
    const tgl2 = new Date(d.tgl_pulang);
    const durasi = Math.ceil((tgl2 - tgl1) / (1000 * 60 * 60 * 24)) + 1;

    const tglC3 = new Date(d.tgl_checkin);
    const tglC4 = new Date(d.tgl_checkout);
    const durasiHotel = Math.ceil((tglC4 - tglC3) / (1000 * 60 * 60 * 24)) || 0;

    // PERUBAHAN DI SINI: Uang harian dikali jumlah pegawai
    const totalUangHarian = parseFloat(d.uang_harian) * durasi * jumlahPegawai;
    const totalHotel = parseFloat(d.tarif_hotel) * durasiHotel;

    const totalBiayaFinal = totalUangHarian + parseFloat(d.biaya_transportasi) + totalHotel;

    // Gabungkan data untuk simpan ke database
    const namaPegawaiAll = namaPegawaiArray.join(', ');
    // ... proses simpan (db.run) gunakan totalBiayaFinal ...
});

// Endpoint untuk mengambil semua data perjadin
app.get('/api/get-perjadin', (req, res) => {
    db.all('SELECT * FROM perjadin ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(3000, () => console.log('Aplikasi Perjadin Running on port 3000'));
