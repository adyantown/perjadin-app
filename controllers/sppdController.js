const db = require('../config/db');

exports.saveSppd = (req, res) => {
    // Kita tangkap semua kiriman dari form (req.body)
    const data = {
        nomor_st: req.body.nomor_st, // [cite: 6, 42]
        tgl_surat: req.body.tgl_surat, // [cite: 45]
        ppk_nama: req.body.ppk_nama, // [cite: 47, 50]
        ppk_nip: req.body.ppk_nip, // [cite: 51]
        nama_pegawai: req.body.nama_pegawai, // [cite: 8, 22]
        nip_pegawai: req.body.nip_pegawai, // [cite: 22]
        pangkat_gol: req.body.pangkat_gol, // [cite: 10, 24]
        jabatan: req.body.jabatan, // [cite: 11, 25]
        tingkat_biaya: req.body.tingkat_biaya, // [cite: 12, 25]
        maksud_dinas: req.body.maksud_dinas, // [cite: 13, 26]
        angkutan: req.body.angkutan, // [cite: 14, 27]
        tempat_berangkat: req.body.tempat_berangkat, // [cite: 15, 28]
        tempat_tujuan: req.body.tempat_tujuan, // [cite: 16, 29]
        lama_hari: req.body.lama_hari, // [cite: 17, 30]
        tgl_berangkat: req.body.tgl_berangkat, // [cite: 18, 31]
        tgl_kembali: req.body.tgl_kembali, // [cite: 19, 32]
        pengikut_nama: req.body.pengikut_nama, // [cite: 20, 23]
        pengikut_nip: req.body.pengikut_nip, // [cite: 21, 23]
        pengikut_ket: req.body.pengikut_ket, // [cite: 33]
        instansi: req.body.instansi, // [cite: 35, 39]
        akun_anggaran: req.body.akun_anggaran, // [cite: 36]
        keterangan_lain: req.body.keterangan_lain, // [cite: 37]
    };

    const query = 'INSERT INTO sppd_kpu SET ?';

    db.query(query, data, (err, result) => {
        if (err) {
            console.error('Error Simpan SPPD:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({
            success: true,
            message: 'Data SPPD Berhasil Disimpan!',
            id: result.insertId, // Kita kirim ID-nya untuk keperluan cetak nanti
        });
    });
};

// 1. AMBIL SEMUA DATA (RIWAYAT)
exports.getAllSppd = (req, res) => {
    const query = 'SELECT * FROM sppd_kpu ORDER BY id DESC'; // Yang terbaru paling atas
    db.query(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: rows });
    });
};

// 2. HAPUS DATA
exports.deleteSppd = (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM sppd_kpu WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Data berhasil dihapus!' });
    });
};

// 3. AMBIL SATU DATA (Buat Edit/Cetak Ulang nanti)
exports.getSppdById = (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM sppd_kpu WHERE id = ?';
    db.query(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        res.json({ success: true, data: rows[0] });
    });
};

// 4. UPDATE DATA (Revisi)
exports.updateSppd = (req, res) => {
    const id = req.params.id;
    const data = req.body;

    // Query Update (Syntax 'SET ?' otomatis memetakan field: value)
    const query = 'UPDATE sppd_kpu SET ? WHERE id = ?';

    db.query(query, [data, id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Data berhasil diperbarui!' });
    });
};
