const DokumentasiModel = require('../models/dokumentasiModel');
const PerjadinModel = require('../models/perjadinModel');
const logController = require('./logController');

// ==========================================
// 1. UPLOAD FILE SPJ OLEH PEGAWAI
// ==========================================
exports.uploadSpj = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Wajib upload file PDF SPJ!' });
        }

        const nomor_st = req.body.nomor_st;
        const file_pdf = req.file.path; // URL lengkap dari Cloudinary

        // Intip siapa yang lagi login dari session
        const uploaded_by = req.session.nama || 'Pegawai';

        // 1. Cari perjadin berdasarkan nomor surat tugas
        const perjadinResults = await DokumentasiModel.getPerjadinIdByNomorSt(nomor_st);

        if (perjadinResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Surat Tugas tidak ditemukan!' });
        }

        const perjadinId = perjadinResults[0].id;

        // 2. Cek apakah sudah punya SPJ sebelumnya
        const existingSpj = await DokumentasiModel.getExistingSpjByPerjadinId(perjadinId);

        if (existingSpj.length > 0) {
            // UPDATE (revisi upload)
            await DokumentasiModel.updateSpjFile(file_pdf, uploaded_by, perjadinId);
        } else {
            // INSERT baru
            await DokumentasiModel.insertSpj(perjadinId, file_pdf, uploaded_by);
        }

        // 3. Tandai perjadin bahwa SPJ sudah diupload
        try {
            await PerjadinModel.updateStatusSpj(nomor_st, 1);
        } catch (e) {
            console.error('Gagal update status_spj:', e);
        }

        logController.catatLog(req, 'Upload SPJ', `Upload SPJ untuk Surat Tugas: ${nomor_st}`);
        res.json({ success: true, message: 'File SPJ berhasil diupload dan menunggu verifikasi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. AMBIL SEMUA ANTREAN SPJ (UNTUK ADMIN)
// ==========================================
exports.getAllSpj = async (req, res) => {
    try {
        const rows = await DokumentasiModel.getAllSpjWithPerjadin();
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ==========================================
// 3. PROSES VERIFIKASI (ACC / REVISI OLEH ADMIN)
// ==========================================
exports.verifikasiSpj = async (req, res) => {
    try {
        const spjId = req.params.id;
        const { status, catatan_admin } = req.body;

        // Cari nomor ST untuk keperluan log
        const stResult = await DokumentasiModel.getNomorStBySpjId(spjId);
        const nomorStLog = stResult.length > 0 ? stResult[0].nomor_st : `ID ${spjId}`;

        await DokumentasiModel.updateSpjStatus(spjId, status, catatan_admin);
        logController.catatLog(req, 'Verifikasi SPJ', `Mengubah status SPJ ${nomorStLog} menjadi ${status}`);
        res.json({ success: true, message: `SPJ berhasil di-set menjadi: ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ==========================================
// 4. HAPUS SPJ
// ==========================================
exports.deleteSpj = async (req, res) => {
    try {
        const id = req.params.id;

        // Ambil nomor_st sebelum dihapus, supaya bisa reset status_spj
        const stResult = await DokumentasiModel.getNomorStBySpjId(id);
        const nomorSt = stResult.length > 0 ? stResult[0].nomor_st : null;

        await DokumentasiModel.deleteSpj(id);

        // Reset status_spj di perjadin jika sudah tidak ada SPJ lagi
        if (nomorSt) {
            try {
                const perjadinResults = await DokumentasiModel.getPerjadinIdByNomorSt(nomorSt);
                if (perjadinResults.length > 0) {
                    const remaining = await DokumentasiModel.getExistingSpjByPerjadinId(perjadinResults[0].id);
                    if (remaining.length === 0) {
                        await PerjadinModel.updateStatusSpj(nomorSt, 0);
                    }
                }
            } catch (e) {
                console.error('Gagal reset status_spj:', e);
            }
        }

        logController.catatLog(req, 'Hapus SPJ', `Menghapus file SPJ Surat Tugas: ${nomorSt || id}`);
        res.json({ success: true, message: 'Data SPJ berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
