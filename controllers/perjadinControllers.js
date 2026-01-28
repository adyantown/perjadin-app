// --- ENDPOINT SIMPAN & UPDATE ---
const db = require('../config/db');

const cleanMoney = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/\./g, '')) || 0;
};

exports.save = (req, res) => {
    const d = req.body;
    const editId = d.id_edit;
    const rawNama = d['nama_pegawai[]'] || d.nama_pegawai || [];
    const rawGol = d['golongan[]'] || d.golongan || [];
    const rawJab = d['jabatan[]'] || d.jabatan || [];

    console.log('ISI BODY DARI FRONTEND:', d); // Cek terminal Node.js Mas!
    try {
        // 1. DATA PEGAWAI (Gunakan pembersihan array yang konsisten)
        const getArrayData = (val) => {
            if (!val) return [];
            return Array.isArray(val) ? val : [val];
        };

        const namaArray = Array.isArray(rawNama) ? rawNama : rawNama ? [rawNama] : [];
        const golArray = Array.isArray(rawGol) ? rawGol : [rawGol].filter(Boolean);
        const jabArray = Array.isArray(rawJab) ? rawJab : [rawJab].filter(Boolean);

        let namaPegawaiAll = namaArray
            .map((n) => n.trim())
            .filter((n) => n !== '')
            .join(', ');

        if (!namaPegawaiAll) {
            namaPegawaiAll = 'Tidak ada nama'; // Supaya di DB tidak kosong melompong
        }
        const golonganAll = golArray
            .map((g) => g.trim())
            .filter((g) => g !== '')
            .join(', ');
        const jabatanAll = jabArray
            .map((j) => j.trim())
            .filter((j) => j !== '')
            .join(', ');
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
        // --- BAGIAN PENYUSUNAN PARAMETER (PASTIKAN URUTANNYA SAMA DENGAN KOLOM SQL) ---
        const params = [
            d.no_surat_tugas, // 1
            d.tgl_surat_tugas, // 2
            namaPegawaiAll, // 3 (Ini yang tadi hilang/kosong)
            golonganAll, // 4
            jabatanAll, // 5
            jumlahPegawai, // 6
            d.tujuan, // 7
            d.maksud_dinas, // 8
            d.tgl_berangkat, // 9
            d.tgl_pulang, // 10
            uangHarianClean, // 11
            d.jenis_transportasi, // 12
            biayaTransClean, // 13
            d.nama_hotel, // 14
            tarifHotelClean, // 15
            fixCheckin, // 16
            fixCheckout, // 17
            grandTotal, // 18
        ];

        // Log untuk memastikan data siap kirim ke DB
        console.log('Data Pegawai siap simpan:', namaPegawaiAll);

        // 8. EKSEKUSI SQL
        if (editId && editId !== '') {
            // MODE UPDATE
            const sqlUpdate = `UPDATE perjadin SET 
                no_surat_tugas=?, tgl_surat_tugas=?, nama_pegawai=?, golongan=?, jabatan=?, 
                jumlah_sppd=?, tujuan=?, maksud_dinas=?, tgl_berangkat=?, tgl_pulang=?, 
                uang_harian=?, jenis_transportasi=?, biaya_transportasi=?, nama_hotel=?, 
                tarif_hotel=?, tgl_checkin=?, tgl_checkout=?, total_biaya=? 
                WHERE id=?`;

            db.query(sqlUpdate, [...params, editId], (err, result) => {
                if (err) {
                    console.error('SQL Update Error:', err);
                    return res.status(500).json({ success: false, message: err.message });
                }
                res.json({ success: true, message: 'Data Berhasil Diupdate!' });
            });
        } else {
            // MODE INSERT
            const sqlInsert = `INSERT INTO perjadin (
                no_surat_tugas, tgl_surat_tugas, nama_pegawai, golongan, jabatan, 
                jumlah_sppd, tujuan, maksud_dinas, tgl_berangkat, tgl_pulang, 
                uang_harian, jenis_transportasi, biaya_transportasi, nama_hotel, 
                tarif_hotel, tgl_checkin, tgl_checkout, total_biaya
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

            db.query(sqlInsert, params, (err, result) => {
                if (err) {
                    console.error('SQL Insert Error:', err);
                    return res.status(500).json({ success: false, message: err.message });
                }
                res.json({ success: true, message: 'Data Berhasil Disimpan!' });
            });
        }
    } catch (error) {
        console.error('SERVER CRASH ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAll = (req, res) => {
    db.query('SELECT * FROM perjadin ORDER BY id DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.getById = (req, res) => {
    db.query('SELECT * FROM perjadin WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
    });
};

exports.delete = (req, res) => {
    db.query('DELETE FROM perjadin WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        // GANTI res.sendStatus(200) JADI INI:
        res.json({ success: true, message: 'Data Berhasil Dihapus!' });
    });
};

// --- AKHIR ENDPOINT SIMPAN & UPDATE ---
