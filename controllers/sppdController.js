const SppdModel = require('../models/sppdModel');
const logController = require('./logController');

exports.saveSppd = async (req, res) => {
    try {
        // Kita tangkap semua kiriman dari form (req.body)
        const data = {
            nomor_st: req.body.nomor_st,
            tgl_surat: req.body.tgl_surat,
            ppk_nama: req.body.ppk_nama,
            ppk_nip: req.body.ppk_nip,
            nama_pegawai: req.body.nama_pegawai,
            nip_pegawai: req.body.nip_pegawai,
            pangkat_gol: req.body.pangkat_gol,
            jabatan: req.body.jabatan,
            tingkat_biaya: req.body.tingkat_biaya,
            maksud_dinas: req.body.maksud_dinas,
            angkutan: req.body.angkutan,
            tempat_berangkat: req.body.tempat_berangkat,
            tempat_tujuan: req.body.tempat_tujuan,
            lama_hari: req.body.lama_hari,
            tgl_berangkat: req.body.tgl_berangkat,
            tgl_kembali: req.body.tgl_kembali,
            pengikut_nama: req.body.pengikut_nama,
            pengikut_nip: req.body.pengikut_nip,
            pengikut_ket: req.body.pengikut_ket,
            instansi: req.body.instansi,
            akun_anggaran: req.body.akun_anggaran,
            keterangan_lain: req.body.keterangan_lain,
        };

        const result = await SppdModel.create(data);
        logController.catatLog(req, 'Buat SPPD', `Membuat SPPD Baru dengan Nomor: ${data.nomor_st}`);
        res.json({
            success: true,
            message: 'Data SPPD Berhasil Disimpan!',
            id: result.insertId, // Kita kirim ID-nya untuk keperluan cetak nanti
        });
    } catch (err) {
        console.error('Error Simpan SPPD:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 1. AMBIL SEMUA DATA (RIWAYAT)
exports.getAllSppd = async (req, res) => {
    try {
        const rows = await SppdModel.getAll();
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. HAPUS DATA
exports.deleteSppd = async (req, res) => {
    try {
        const id = req.params.id;
        await SppdModel.delete(id);
        logController.catatLog(req, 'Hapus SPPD', `Menghapus data SPPD ID: ${id}`);
        res.json({ success: true, message: 'Data berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. AMBIL SATU DATA (Buat Edit/Cetak Ulang nanti)
exports.getSppdById = async (req, res) => {
    try {
        const id = req.params.id;
        const rows = await SppdModel.getById(id);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. UPDATE DATA (Revisi)
exports.updateSppd = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        await SppdModel.update(id, data);
        logController.catatLog(req, 'Edit SPPD', `Mengubah data SPPD ID: ${id}`);
        res.json({ success: true, message: 'Data berhasil diperbarui!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
