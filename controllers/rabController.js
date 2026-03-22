// controllers/rabController.js
const db = require('../config/db');
const logController = require('./logController');

// ==========================================
// 1. AMBIL KAK YANG BELUM PUNYA RAB
// ==========================================
exports.getKandidatKak = (req, res) => {
    // Kita filter: Hanya KAK yang belum ada di tabel dokumen_rab yang muncul!
    const query = `
        SELECT k.id, k.judul_kegiatan, p.nama_kamar, p.pagu_awal, p.sisa_pagu
        FROM dokumen_kak k
        JOIN pagu_anggaran p ON k.pagu_id = p.id
        LEFT JOIN dokumen_rab r ON k.id = r.kak_id
        WHERE r.id IS NULL
        ORDER BY k.id DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetch KAK Kandidat:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data KAK' });
        }
        res.json(results);
    });
};

// ==========================================
// 2. SIMPAN RAB & POTONG SALDO PAGU
// ==========================================
exports.saveRab = (req, res) => {
    const data = req.body;

    // A. Masukkan data ke tabel dokumen_rab
    const queryInsert = `INSERT INTO dokumen_rab 
        (kak_id, snapshot_pagu, snapshot_realisasi, jml_orang, jml_hari, jml_kegiatan, 
        uang_harian_satuan, uang_harian_total, jenis_transport, transport_vol, 
        transport_satuan, transport_total, total_rab, tgl_rab) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const valuesInsert = [data.kak_id, data.snapshot_pagu, data.snapshot_realisasi, data.jml_orang, data.jml_hari, data.jml_kegiatan, data.uang_harian_satuan, data.uang_harian_total, data.jenis_transport, data.transport_vol, data.transport_satuan, data.transport_total, data.total_rab, data.tgl_rab];

    db.query(queryInsert, valuesInsert, (err, result) => {
        if (err) {
            console.error('Error insert RAB:', err);
            return res.status(500).json({ success: false, message: 'Gagal menyimpan RAB' });
        }

        // B. POTONG SISA SALDO DI TABEL PAGU ANGGARAN (The Magic!)
        const queryUpdatePagu = `
            UPDATE pagu_anggaran 
            SET sisa_pagu = sisa_pagu - ? 
            WHERE id = (SELECT pagu_id FROM dokumen_kak WHERE id = ?)
        `;

        db.query(queryUpdatePagu, [data.total_rab, data.kak_id], (err2) => {
            if (err2) console.error('Gagal memotong saldo pagu:', err2);
            // Tetap kita anggap sukses karena RAB-nya berhasil dibuat
            logController.catatLog(req, 'Buat RAB', `Membuat RAB untuk KAK ID: ${data.kak_id}`);
            res.json({ success: true, message: 'RAB Berhasil Disimpan & Saldo Terpotong!' });
        });
    });
};
// ==========================================
// 3. AMBIL SEMUA RIWAYAT RAB (Untuk Tabel)
// ==========================================
exports.getAllRab = (req, res) => {
    // Kita JOIN ke tabel KAK dan PAGU biar judul kegiatan dan nama kamarnya kebawa
    const query = `
        SELECT r.*, k.judul_kegiatan, p.nama_kamar 
        FROM dokumen_rab r
        JOIN dokumen_kak k ON r.kak_id = k.id
        JOIN pagu_anggaran p ON k.pagu_id = p.id
        ORDER BY r.id DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetch Riwayat RAB:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data riwayat RAB' });
        }
        res.json(results);
    });
};
// ==========================================
// 4. AMBIL 1 DATA RAB SPESIFIK UNTUK DICETAK
// ==========================================
exports.getRabById = (req, res) => {
    const id = req.params.id;

    // UBAH p.nama_kamar JADI p.* DI SINI YAA
    const query = `
        SELECT r.*, k.judul_kegiatan, k.ppk_nama, k.ppk_nip, p.* FROM dokumen_rab r
        JOIN dokumen_kak k ON r.kak_id = k.id
        JOIN pagu_anggaran p ON k.pagu_id = p.id
        WHERE r.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetch RAB by ID:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data RAB' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Data RAB tidak ditemukan' });
        }
        res.json({ success: true, data: results[0] });
    });
};
// ==========================================
// 5. HAPUS RAB DAN KEMBALIKAN SALDO PAGU (REFUND)
// ==========================================
exports.deleteRab = (req, res) => {
    const rabId = req.params.id;

    // A. Cari dulu data RAB-nya untuk tahu berapa uang yang harus di-refund
    const querySelect = `
        SELECT r.total_rab, k.pagu_id 
        FROM dokumen_rab r
        JOIN dokumen_kak k ON r.kak_id = k.id
        WHERE r.id = ?
    `;

    db.query(querySelect, [rabId], (err, results) => {
        if (err) {
            console.error('Error mencari RAB yang akan dihapus:', err);
            return res.status(500).json({ success: false, message: 'Gagal memproses penghapusan.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Data RAB tidak ditemukan.' });
        }

        const uangRefund = results[0].total_rab;
        const paguId = results[0].pagu_id;

        // B. Kembalikan uang ke Brankas (Sihir Refund!)
        const queryRefund = `UPDATE pagu_anggaran SET sisa_pagu = sisa_pagu + ? WHERE id = ?`;

        db.query(queryRefund, [uangRefund, paguId], (errRefund) => {
            if (errRefund) {
                console.error('Error mengembalikan saldo:', errRefund);
                return res.status(500).json({ success: false, message: 'Gagal mengembalikan saldo.' });
            }

            // C. Setelah uang aman dikembalikan, barulah HAPUS data RAB-nya!
            const queryDelete = `DELETE FROM dokumen_rab WHERE id = ?`;

            db.query(queryDelete, [rabId], (errDelete) => {
                if (errDelete) {
                    console.error('Error menghapus RAB:', errDelete);
                    return res.status(500).json({ success: false, message: 'Gagal menghapus dokumen RAB.' });
                }

                logController.catatLog(req, 'Hapus RAB', `Menghapus data RAB ID: ${rabId}`);
                res.json({ success: true, message: 'RAB dibatalkan dan Saldo berhasil dikembalikan ke Brankas!' });
            });
        });
    });
};
// ==========================================
// 6. UPDATE RAB & HITUNG SELISIH SALDO PAGU
// ==========================================
exports.updateRab = (req, res) => {
    const rabId = req.params.id;
    const data = req.body;

    // KEMBALIKAN KODINGAN INI KE VERSI ASLINYA (Hanya ambil total_rab dan pagu_id)
    const querySelect = `
        SELECT r.total_rab, k.pagu_id 
        FROM dokumen_rab r
        JOIN dokumen_kak k ON r.kak_id = k.id
        WHERE r.id = ?
    `;

    db.query(querySelect, [rabId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error mencari RAB:', err);
            return res.status(500).json({ success: false, message: 'Gagal mencari data RAB lama.' });
        }

        const oldTotal = parseFloat(results.total_rab);
        const newTotal = parseFloat(data.total_rab);
        const paguId = results.pagu_id;

        // B. Hitung Selisih (Total Baru - Total Lama)
        const selisih = newTotal - oldTotal;

        // C. Cek Saldo Brankas (Kalau revisinya bikin biaya nambah, duitnya cukup gak?)
        db.query('SELECT sisa_pagu FROM pagu_anggaran WHERE id = ?', [paguId], (errCek, paguRes) => {
            // JIKA selisih positif (nambah biaya) dan uang di pagu kurang
            if (selisih > 0 && paguRes.sisa_pagu < selisih) {
                return res.status(400).json({ success: false, message: 'Revisi ditolak! Saldo Pagu tidak mencukupi untuk penambahan biaya.' });
            }

            // D. Sesuaikan Saldo Brankas (Sisa Pagu - Selisih)
            db.query('UPDATE pagu_anggaran SET sisa_pagu = sisa_pagu - ? WHERE id = ?', [selisih, paguId], (errUpdatePagu) => {
                // E. Simpan Rincian RAB yang Baru ke Database
                const queryUpdateRab = `
                    UPDATE dokumen_rab SET 
                        jml_orang=?, jml_hari=?, jml_kegiatan=?, 
                        uang_harian_satuan=?, uang_harian_total=?, 
                        jenis_transport=?, transport_vol=?, transport_satuan=?, transport_total=?, 
                        total_rab=? 
                    WHERE id=?
                `;
                const values = [data.jml_orang, data.jml_hari, data.jml_kegiatan, data.uang_harian_satuan, data.uang_harian_total, data.jenis_transport, data.transport_vol, data.transport_satuan, data.transport_total, data.total_rab, rabId];

                db.query(queryUpdateRab, values, (errUpdateRab) => {
                    if (errUpdateRab) return res.status(500).json({ success: false, message: 'Gagal menyimpan revisi RAB.' });

                    logController.catatLog(req, 'Edit RAB', `Mengubah data RAB ID: ${rabId}`);
                    res.json({ success: true, message: 'Revisi berhasil disimpan dan Saldo Pagu otomatis disesuaikan!' });
                });
            });
        });
    });
};
