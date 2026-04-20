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

        // SSSHHH! Kita intip siapa yang lagi login dari session
        const uploaded_by = req.session.nama || 'Pegawai';

        // 1. Cari semua sppd_id yang punya nomor_st ini
        const sppdResults = await DokumentasiModel.getSppdIdsByNomorSt(nomor_st);

        if (sppdResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Surat Tugas tidak ditemukan!' });
        }

        // Ambil array ID saja
        const sppdIds = sppdResults.map(row => row.id);

        // 2. Cek mana yang udah punya SPJ, mana yang belum
        const spjResults = await DokumentasiModel.getExistingSpjBySppdIds(sppdIds);
        const existingSppdIds = spjResults.map(row => row.sppd_id);

        // Pisahkan mana yang harus di-UPDATE (revisi), mana yang harus di-INSERT (baru)
        const toUpdateIds = [];
        const toInsertIds = [];

        sppdIds.forEach(id => {
            if (existingSppdIds.includes(id)) {
                toUpdateIds.push(id);
            } else {
                toInsertIds.push(id);
            }
        });

        // Jalankan UPDATE dan INSERT secara parallel
        const promises = [];

        if (toUpdateIds.length > 0) {
            promises.push(DokumentasiModel.updateSpjFiles(file_pdf, uploaded_by, toUpdateIds));
        }

        if (toInsertIds.length > 0) {
            const values = toInsertIds.map(id => [id, file_pdf, uploaded_by, 'Menunggu Verifikasi']);
            promises.push(DokumentasiModel.insertSpjBulk(values));
        }

        await Promise.all(promises);

        // Tandai perjadin bahwa SPJ sudah diupload
        try {
            await PerjadinModel.updateStatusSpj(nomor_st, 1);
        } catch (e) {
            console.error('Gagal update status_spj:', e);
        }

        logController.catatLog(req, 'Upload SPJ Rombongan', `Upload SPJ untuk Surat Tugas: ${nomor_st}`);
        res.json({ success: true, message: 'File SPJ Rombongan berhasil diupload dan menunggu verifikasi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. AMBIL SEMUA ANTREAN SPJ (UNTUK ADMIN)
// ==========================================
exports.getAllSpj = async (req, res) => {
    try {
        // Kita JOIN ke tabel sppd_kpu biar admin tau ini SPJ-nya siapa & kegiatan apa
        const rows = await DokumentasiModel.getAllSpjWithSppd();
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
        // status isinya bisa 'ACC' atau 'Revisi'

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
// 4. HAPUS SPJ (OPSIONAL)
// ==========================================
exports.deleteSpj = async (req, res) => {
    try {
        const id = req.params.id;

        // Ambil nomor_st sebelum dihapus, supaya bisa reset status_spj
        const stResult = await DokumentasiModel.getNomorStBySpjId(id);
        const nomorSt = stResult.length > 0 ? stResult[0].nomor_st : null;

        await DokumentasiModel.deleteSpj(id);

        // Reset status_spj di perjadin jika sudah tidak ada SPJ lagi untuk nomor_st ini
        if (nomorSt) {
            try {
                const remaining = await DokumentasiModel.getSppdIdsByNomorSt(nomorSt);
                const remainingIds = remaining.map(r => r.id);
                let hasSpj = false;
                if (remainingIds.length > 0) {
                    const existingSpj = await DokumentasiModel.getExistingSpjBySppdIds(remainingIds);
                    hasSpj = existingSpj.length > 0;
                }
                if (!hasSpj) {
                    await PerjadinModel.updateStatusSpj(nomorSt, 0);
                }
            } catch (e) {
                console.error('Gagal reset status_spj:', e);
            }
        }

        logController.catatLog(req, 'Hapus SPJ', `Menghapus file SPJ ID: ${id}`);
        res.json({ success: true, message: 'Data SPJ berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
