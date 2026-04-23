// --- ENDPOINT SIMPAN & UPDATE ---
const PerjadinModel = require('../models/perjadinModel');
const logController = require('./logController');
const db = require('../config/dbPromise');

const cleanMoney = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/\./g, '')) || 0;
};

const syncPegawaiPivot = async (perjadinId, namaArray) => {
    if (!namaArray || namaArray.length === 0) return;

    // Cari pegawai berdasarkan nama
    for (const nama of namaArray) {
        const cleanNama = nama.trim();
        if (!cleanNama) continue;

        try {
            const rows = await PerjadinModel.findPegawaiByNama(cleanNama);
            if (rows.length === 0) continue;

            const pegawaiId = rows[0].id;
            await PerjadinModel.insertPivot(perjadinId, pegawaiId);
        } catch (err) {
            // Silently continue if a single pivot insert fails
        }
    }
};

exports.save = async (req, res) => {
    const d = req.body;
    const editId = d.id_edit;
    const rawNama = d['nama_pegawai[]'] || d.nama_pegawai || [];
    const rawGol = d['golongan[]'] || d.golongan || [];
    const rawJab = d['jabatan[]'] || d.jabatan || [];

    try {
        // 1. DATA PEGAWAI (Gunakan pembersihan array yang konsisten)
        const namaArray = Array.isArray(rawNama) ? rawNama : rawNama ? [rawNama] : [];
        const golArray = Array.isArray(rawGol) ? rawGol : [rawGol].filter(Boolean);
        const jabArray = Array.isArray(rawJab) ? rawJab : [rawJab].filter(Boolean);

        let namaPegawaiAll = namaArray
            .map((n) => n.trim())
            .filter((n) => n !== '')
            .join('||| ');

        if (!namaPegawaiAll) {
            namaPegawaiAll = 'Tidak ada nama'; // Supaya di DB tidak kosong melompong
        }
        const golonganAll = golArray
            .map((g) => g.trim())
            .filter((g) => g !== '')
            .join('||| ');
        const jabatanAll = jabArray
            .map((j) => j.trim())
            .filter((j) => j !== '')
            .join('||| ');
        const jumlahPegawai = namaArray.filter((n) => n.trim() !== '').length || 1;

        // 2. MEMBERSIHKAN NOMINAL UANG
        const uangHarianClean = cleanMoney(d.uang_harian) || 0;
        const biayaTransClean = cleanMoney(d.biaya_transportasi) || 0;
        const tarifHotelClean = cleanMoney(d.tarif_hotel) || 0;

        // 3. HITUNG DURASI DINAS
        let durasi = 0;
        if (d.tgl_berangkat && d.tgl_pulang) {
            const tglB = new Date(d.tgl_berangkat);
            const tglP = new Date(d.tgl_pulang);
            if (!isNaN(tglB) && !isNaN(tglP)) {
                durasi = Math.ceil((tglP - tglB) / (1000 * 60 * 60 * 24)) + 1;
            }
        }
        durasi = durasi > 0 ? durasi : 0;

        // 4. HITUNG DURASI HOTEL
        let durasiHotel = 0;
        if (d.tgl_checkin && d.tgl_checkout) {
            const tglIn = new Date(d.tgl_checkin);
            const tglOut = new Date(d.tgl_checkout);
            if (!isNaN(tglIn) && !isNaN(tglOut)) {
                durasiHotel = Math.ceil((tglOut - tglIn) / (1000 * 60 * 60 * 24));
            }
        }
        durasiHotel = durasiHotel > 0 ? durasiHotel : 0;

        // 5. HITUNG TOTAL AKHIR
        const grandTotal = uangHarianClean * durasi * jumlahPegawai + biayaTransClean + tarifHotelClean * durasiHotel;

        // 6. TANGGANI TANGGAL KOSONG (Agar jadi NULL di MySQL)
        const fixCheckin = !d.tgl_checkin || d.tgl_checkin === '' ? null : d.tgl_checkin;
        const fixCheckout = !d.tgl_checkout || d.tgl_checkout === '' ? null : d.tgl_checkout;

        // 7. SIAPKAN PARAMETER (Harus urut sesuai kolom DB)
        const params = [
            d.no_surat_tugas, // 1
            d.tgl_surat_tugas, // 2
            d.menimbang || '', // 3 (NEW)
            d.dasar || '', // 4 (NEW)
            namaPegawaiAll, // 5
            golonganAll, // 6
            jabatanAll, // 7
            jumlahPegawai, // 8
            d.tujuan, // 9
            d.maksud_dinas, // 10
            d.uraian_tugas || '', // 11 (NEW)
            d.tgl_berangkat, // 12
            d.tgl_pulang, // 13
            uangHarianClean, // 14
            d.jenis_transportasi, // 15
            biayaTransClean, // 16
            d.nama_hotel, // 17
            tarifHotelClean, // 18
            fixCheckin, // 19
            fixCheckout, // 20
            grandTotal, // 21
        ];

        // 8. EKSEKUSI SQL
        if (editId && editId !== '') {
            // MODE UPDATE
            await PerjadinModel.update(editId, params);

            // 1️⃣ Hapus relasi pegawai lama
            try {
                await PerjadinModel.deletePivot(editId);
            } catch (e) {}

            // 2️⃣ Insert ulang relasi pegawai baru
            try {
                await syncPegawaiPivot(editId, namaArray);
            } catch (e) {
                console.error('Gagal sync pivot:', e);
            }

            // 3️⃣ Log aktivitas
            try {
                logController.catatLog(req, 'Edit Perjadin', `Mengubah data rekap biaya Surat Tugas: ${d.no_surat_tugas}`);
            } catch (e) {}

            // 4️⃣ Response ke frontend
            res.json({ success: true, message: 'Data Berhasil Diupdate!' });
        } else {
            // MODE INSERT
            const result = await PerjadinModel.insert(params);

            // ---> PASANG CCTV DI SINI <---
            try {
                logController.catatLog(req, 'Tambah Data Perjadin', `Berhasil Menambah Data Perjadin`);
            } catch (e) {}

            const newId = result.insertId;

            // Sinkronkan ke pivot
            try {
                await syncPegawaiPivot(newId, namaArray);
            } catch (e) {
                console.error('Gagal sync pivot:', e);
            }
            res.json({ success: true, message: 'Data Berhasil Disimpan!' });
        }
    } catch (error) {
        console.error('SERVER CRASH ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const rows = await PerjadinModel.getAll();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const rows = await PerjadinModel.getById(req.params.id);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        // GUARD: Cek apakah perjadin ini sudah di-SPJ-kan
        const rows = await PerjadinModel.getById(req.params.id);
        if (rows.length > 0 && rows[0].status_spj) {
            return res.status(403).json({ success: false, message: 'Data terkunci! Perjadin ini sudah memiliki SPJ dan tidak bisa dihapus.' });
        }

        await PerjadinModel.delete(req.params.id);

        // ---> PASANG CCTV DI SINI <---
        try {
            logController.catatLog(req, 'Hapus Perjadin', `Menghapus data rekap biaya dengan ID: ${req.params.id}`);
        } catch (e) {}

        res.json({ success: true, message: 'Data Berhasil Dihapus!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- AKHIR ENDPOINT SIMPAN & UPDATE ---
// --- ENDPOINT ANALITIK PEGAWAI ---
exports.getAnalitikPegawai = async (req, res) => {
    try {
        const pegawaiId = req.params.id;
        // Query sakti: Gabungkan tabel perjadin dengan pivot table
        const rows = await PerjadinModel.getAnalitikByPegawai(pegawaiId);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getKuitansiDetail = async (req, res) => {
    try {
        const id = req.params.id;
        const rows = await PerjadinModel.getKuitansiData(id);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data rincian biaya tidak ditemukan' });
        }

        const data = rows[0];

        // ==========================================
        // 🚀 LOGIKA PEMISAH NAMA (ANTI-GELAR & ANTI-BUG)
        // ==========================================
        let rawNama = data.nama_pegawai || '';
        let listPegawai = [];

        // Jaga-jaga kalau formatnya array JSON (konversi ke string |||)
        try {
            const parsed = JSON.parse(rawNama);
            if (Array.isArray(parsed)) {
                rawNama = parsed.join('|||');
            }
        } catch (e) {}

        if (typeof rawNama === 'string' && rawNama.trim() !== '') {
            let individualNames = [];

            // HANYA pecah jika ada separator |||
            // Kita buang pemisah koma (,) karena bentrok dengan gelar (S.T., S.Kom)
            if (rawNama.includes('|||')) {
                individualNames = rawNama.split('|||');
            } else {
                // Jika tidak ada |||, maka anggap itu adalah SATU orang utuh
                // Meskipun di dalamnya ada koma (seperti: HENDY SYUHADA, S.T.)
                individualNames = [rawNama];
            }

            for (const item of individualNames) {
                let nama = item.trim();
                if (nama !== '') {
                    // Cari NIP dari master_pegawai berdasarkan nama
                    let nip = '-';
                    try {
                        const pegawaiRows = await PerjadinModel.findPegawaiByNama(nama);
                        if (pegawaiRows.length > 0) {
                            const detailRows = await db.query('SELECT nip_nik FROM master_pegawai WHERE id = ?', [pegawaiRows[0].id]);
                            if (detailRows.length > 0 && detailRows[0].nip_nik) {
                                nip = detailRows[0].nip_nik;
                            }
                        }
                    } catch (e) {}
                    listPegawai.push({ nama: nama, nip: nip });
                }
            }
        }

        // Fallback jika kosong
        if (listPegawai.length === 0) {
            listPegawai.push({ nama: '-', nip: '-' });
        }

        data.listPegawai = listPegawai;
        // ==========================================
        // ==========================================

        res.json({ success: true, data: data });
    } catch (err) {
        console.error('Error fetch kuitansi:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil rincian kuitansi' });
    }
};
