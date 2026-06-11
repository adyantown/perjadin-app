// --- ENDPOINT SIMPAN & UPDATE ---
const PerjadinModel = require('../models/perjadinModel');
const logController = require('./logController');
const db = require('../config/dbPromise');

const cleanMoney = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/\./g, '')) || 0;
};

const syncPegawaiPivot = async (perjadinId, pegawaiIdArray) => {
    if (!pegawaiIdArray || pegawaiIdArray.length === 0) return;

    for (const rawId of pegawaiIdArray) {
        const pegawaiId = parseInt(rawId);
        // Skip jika kosong atau bukan angka (pegawai manual luar satker)
        if (!pegawaiId || isNaN(pegawaiId)) continue;

        try {
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
    const rawPegawaiId = d['pegawai_id[]'] || d.pegawai_id || [];
    const pegawaiIdArray = Array.isArray(rawPegawaiId) ? rawPegawaiId : [rawPegawaiId].filter(Boolean);

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
        const biayaBbmClean = cleanMoney(d.biaya_bbm) || 0;
        const biayaTolClean = cleanMoney(d.biaya_tol) || 0;
        const biayaTiketClean = cleanMoney(d.biaya_tiket) || 0;
        const biayaParkirClean = cleanMoney(d.biaya_parkir) || 0;
        const biayaTransClean = biayaBbmClean + biayaTolClean + biayaTiketClean + biayaParkirClean;
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
            d.menimbang || '', // 3
            d.dasar || '', // 4
            namaPegawaiAll, // 5
            golonganAll, // 6
            jabatanAll, // 7
            jumlahPegawai, // 8
            d.tujuan, // 9
            d.maksud_dinas, // 10
            d.uraian_tugas || '', // 11
            d.tgl_berangkat, // 12
            d.tgl_pulang, // 13
            uangHarianClean, // 14
            d.ket_harian || '', // 15
            d.jenis_transportasi, // 16
            biayaTransClean, // 17 (total transport = bbm+tol+tiket+parkir)
            biayaBbmClean, // 17
            d.ket_bbm || '', // 18
            biayaTolClean, // 19
            d.ket_tol || '', // 20
            biayaTiketClean, // 21
            d.ket_tiket || '', // 22
            biayaParkirClean, // 23
            d.ket_parkir || '', // 24
            d.nama_hotel, // 25
            tarifHotelClean, // 26
            fixCheckin, // 27
            fixCheckout, // 28
            grandTotal, // 29
        ];

        // 8. EKSEKUSI SQL
        if (editId && editId !== '') {
            // MODE UPDATE
            await PerjadinModel.update(editId, params);

            // 1️⃣ Hapus relasi pegawai lama
            try {
                await PerjadinModel.deletePivot(editId);
            } catch (e) {}

            // 2️⃣ Insert ulang relasi pegawai baru (pakai ID langsung)
            try {
                await syncPegawaiPivot(editId, pegawaiIdArray);
            } catch (e) {
                console.error('Gagal sync pivot:', e);
            }

            // 3️⃣ Log aktivitas
            try {
                logController.catatLog(req, 'Edit Perjadin', `Mengubah data perjadin Surat Tugas: ${d.no_surat_tugas}`);
            } catch (e) {}

            // 4️⃣ Response ke frontend
            res.json({ success: true, message: 'Data Berhasil Diupdate!' });
        } else {
            // MODE INSERT
            const result = await PerjadinModel.insert(params);

            // ---> PASANG CCTV DI SINI <---
            try {
                logController.catatLog(req, 'Tambah Data Perjadin', `Menambah data perjadin Surat Tugas: ${d.no_surat_tugas}`);
            } catch (e) {}

            const newId = result.insertId;

            // Sinkronkan ke pivot (pakai ID langsung)
            try {
                await syncPegawaiPivot(newId, pegawaiIdArray);
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
        const data = rows[0];
        if (data) {
            // Sertakan data pegawai dari pivot table untuk mode edit
            const pegawaiList = await PerjadinModel.getPegawaiByPerjadinId(req.params.id);
            data.pegawai_list = pegawaiList;
        }
        res.json(data);
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
            const noSurat = rows.length > 0 ? rows[0].no_surat_tugas : 'Tidak Diketahui';
            logController.catatLog(req, 'Hapus Perjadin', `Menghapus data perjadin Surat Tugas: ${noSurat}`);
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

// --- ENDPOINT RANKING PEGAWAI (Semua Pegawai diurutkan berdasarkan jumlah perjadin) ---
exports.getRankingPegawai = async (req, res) => {
    try {
        const rows = await PerjadinModel.getRankingPegawai();
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
        // 🚀 AMBIL SEMUA PEGAWAI DARI TEKS + ENRICHMENT NIP DARI PIVOT
        // ==========================================
        let listPegawai = [];

        // 1. Ambil data NIP dari pivot table (1 query JOIN, untuk enrichment)
        let pivotMap = {};
        try {
            const pivotRows = await PerjadinModel.getPegawaiByPerjadinId(id);
            if (pivotRows && pivotRows.length > 0) {
                pivotRows.forEach((p) => {
                    // Map nama → nip untuk lookup cepat
                    pivotMap[p.nama_pegawai.trim().toUpperCase()] = p.nip || '-';
                });
            }
        } catch (e) {
            console.error('Gagal ambil pivot pegawai:', e);
        }

        // 2. Baca SEMUA nama dari kolom teks (termasuk pegawai manual)
        let rawNama = data.nama_pegawai || '';
        try {
            const parsed = JSON.parse(rawNama);
            if (Array.isArray(parsed)) rawNama = parsed.join('|||');
        } catch (e) {}

        if (typeof rawNama === 'string' && rawNama.trim() !== '') {
            const names = rawNama.includes('|||') ? rawNama.split('|||') : [rawNama];
            for (const item of names) {
                const nama = item.trim();
                if (!nama) continue;

                // Cek NIP dari pivot map dulu (O(1) lookup)
                const namaKey = nama.toUpperCase();
                let nip = pivotMap[namaKey] || '-';

                // Fallback LIKE search hanya jika pivot tidak punya data
                if (nip === '-') {
                    try {
                        const pegawaiRows = await PerjadinModel.findPegawaiByNama(nama);
                        if (pegawaiRows.length > 0) {
                            const detailRows = await db.query('SELECT nip_nik FROM master_pegawai WHERE id = ?', [pegawaiRows[0].id]);
                            if (detailRows.length > 0 && detailRows[0].nip_nik) nip = detailRows[0].nip_nik;
                        }
                    } catch (e) {}
                }

                listPegawai.push({ nama, nip });
            }
        }

        // Final fallback
        if (listPegawai.length === 0) {
            listPegawai.push({ nama: '-', nip: '-' });
        }

        data.listPegawai = listPegawai;

        res.json({ success: true, data: data });
    } catch (err) {
        console.error('Error fetch kuitansi:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil rincian kuitansi' });
    }
};
