// public/js/perjadin-handler.js
// VERSI FINAL & RAPI

// --- 1. FUNGSI TAMBAH PEGAWAI (TAMPILAN BOOTSTRAP CARD) ---
function tambahPegawai(nama = '', gol = '', jab = '', pegawaiId = '') {
    const container = document.getElementById('pegawai-container');

    // HTML Template dengan Card Bootstrap (Ini yang bikin rapi!)
    const htmlBaris = `
        <div class="pegawai-row card mb-3 bg-light border-0 shadow-sm">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold m-0" style="color: #800000;">
                        <i class="bi bi-person-badge-fill me-1"></i> Data Pegawai
                    </h6>
                    <button type="button" class="btn btn-merah-terang btn-sm btn-remove" onclick="hapusBaris(this)" title="Hapus Baris Ini">
                        <i class="bi bi-trash"></i> Hapus
                    </button>
                </div>
                <input type="hidden" name="pegawai_id[]" value="${pegawaiId}">
                <div class="row g-2">
                    <div class="col-md-5">
                        <label class="form-label small text-muted fw-bold">Nama Pegawai</label>
                        <input type="text" name="nama_pegawai[]" value="${nama}" class="form-control" placeholder="Nama Lengkap" required>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small text-muted fw-bold">Golongan</label>
                        <input type="text" name="golongan[]" value="${gol}" class="form-control" placeholder="Contoh: IV/a">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-muted fw-bold">Jabatan</label>
                        <input type="text" name="jabatan[]" value="${jab}" class="form-control" placeholder="Jabatan" required>
                    </div>
                </div>
            </div>
        </div>`;

    container.insertAdjacentHTML('beforeend', htmlBaris);
    updateTombolHapus();
    hitungOtomatis(); // Hitung ulang total biaya
}

// --- 2. FUNGSI HAPUS BARIS ---
function hapusBaris(btn) {
    btn.closest('.pegawai-row').remove();
    updateTombolHapus();
    hitungOtomatis();
}

// --- 3. UTILS: UPDATE TOMBOL HAPUS ---
function updateTombolHapus() {
    const rows = document.querySelectorAll('.pegawai-row');
    // Jika baris tinggal 1, sembunyikan tombol hapus biar gak kosong melompong
    rows.forEach((row) => {
        const btn = row.querySelector('.btn-remove');
        if (btn) btn.style.display = rows.length === 1 ? 'none' : 'block';
    });
}

// --- 4. LOGIKA LOAD DATA PEGAWAI (DROPDOWN OTOMATIS) ---
window.dataPegawai = [];
let sppdCache = [];

// Fungsi untuk Load Dropdown Surat Tugas
// async function loadSppdDropdown() {
//     const select = document.getElementById('selectSppd');
//     try {
//         const res = await fetch('/api/sppd/all');
//         const json = await res.json();

//         if (json.success && json.data) {
//             sppdCache = json.data; // Simpan ke wadah
//             select.innerHTML = '<option value="">-- Pilih Surat Tugas dari SPPD --</option>';

//             const uniqueST = [];

//             json.data.forEach((item) => {
//                 if (!uniqueST.includes(item.nomor_st)) {
//                     uniqueST.push(item.nomor_st);

//                     const option = document.createElement('option');
//                     option.value = item.nomor_st;

//                     // Hitung jumlah rombongan
//                     const rombonganCount = json.data.filter(s => s.nomor_st === item.nomor_st).length;

//                     option.textContent = `${item.nomor_st} (Ke: ${item.tempat_tujuan} - ${rombonganCount} Orang)`;
//                     select.appendChild(option);
//                 }
//             });
//         }
//     } catch (e) {
//         console.error('Gagal meload SPPD:', e);
//         select.innerHTML = '<option value="">Gagal memuat data</option>';
//     }
// }

// Fungsi Auto-Fill saat Dropdown Dipilih
window.autoFillSppd = function () {
    const select = document.getElementById('selectSppd');
    const selectedNoSt = select.value;

    // Cari semua SPPD yang berada dalam satu rombongan (nomor_st sama)
    const allSppdUnderSt = sppdCache.filter((s) => s.nomor_st === selectedNoSt);
    const sppd = allSppdUnderSt[0]; // Jadikan indeks pertama sebagai referensi data perjalanan dinas

    if (sppd) {
        const formatDate = (d) => (d ? d.split('T')[0] : '');

        // 1. Isi Data Administrasi dan Perjalanan
        document.getElementById('tgl_surat_tugas').value = formatDate(sppd.tgl_surat);
        document.querySelector('[name="maksud_dinas"]').value = sppd.maksud_dinas || '';
        document.querySelector('[name="tujuan"]').value = sppd.tempat_tujuan || '';
        document.querySelector('[name="tgl_berangkat"]').value = formatDate(sppd.tgl_berangkat);
        document.querySelector('[name="tgl_pulang"]').value = formatDate(sppd.tgl_kembali);

        // 2. AUTO-FILL ROMBONGAN PEGAWAI
        // Bersihkan daftar pegawai lama (hapus row kosong atau rombongan lama)
        const container = document.getElementById('pegawai-container');
        container.innerHTML = '';

        // Loop tiap pegawai di rombongan SPPD ini, lalu masukkan ke dalam form
        allSppdUnderSt.forEach((item) => {
            // Bersihkan format "Nama / NIP" menjadi "Nama" saja
            const namaUtama = item.nama_pegawai ? item.nama_pegawai.split(' /')[0] : '';
            const golUtama = item.pangkat_gol || '';
            const jabUtama = item.jabatan || '';

            tambahPegawai(namaUtama, golUtama, jabUtama);
        });

        hitungOtomatis(); // Jalankan fungsi hitung total
    } else {
        // Kosongkan kalau admin memilih "-- Pilih Surat Tugas --"
        document.getElementById('tgl_surat_tugas').value = '';
        document.querySelector('[name="maksud_dinas"]').value = '';
        document.querySelector('[name="tujuan"]').value = '';

        // Reset wadah pegawai dan berikan 1 ruang input kosong manual
        const container = document.getElementById('pegawai-container');
        container.innerHTML = '';
        tambahPegawai();
    }
};

window.loadPegawai = async function (kategori) {
    // Reset dropdown biar bersih
    const dropdown = document.getElementById('selectNama');
    dropdown.innerHTML = '<option value="">Memuat data...</option>';

    try {
        const response = await fetch(`/api/pegawai/${kategori}`);
        if (!response.ok) throw new Error('Gagal koneksi API');

        window.dataPegawai = await response.json();

        dropdown.innerHTML = '<option value="">-- Pilih Nama dari Hasil Filter --</option>';

        window.dataPegawai.forEach((p) => {
            const option = document.createElement('option');
            // Gunakan NIP atau ID sebagai value unik
            option.value = p.nip_nik || p.id;
            option.textContent = p.nama_pegawai;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        dropdown.innerHTML = '<option value="">Gagal memuat data</option>';
    }
};

window.tambahPegawaiOtomatis = function () {
    const dropdown = document.getElementById('selectNama');
    const valTerpilih = dropdown.value;
    if (!valTerpilih) return;

    // Cari data pegawai di memory browser
    const p = window.dataPegawai.find((peg) => (peg.nip_nik || peg.id) == valTerpilih);

    if (p) {
        const displayGol = p.pangkat ? `${p.pangkat} (${p.golongan})` : p.golongan;

        // Cek: Apakah baris pertama masih kosong?
        const rows = document.querySelectorAll('.pegawai-row');
        const firstRow = rows[0];
        const inputNamaPertama = firstRow ? firstRow.querySelector('[name="nama_pegawai[]"]') : null;

        if (firstRow && (!inputNamaPertama.value || inputNamaPertama.value.trim() === '')) {
            // Kalau kosong, TIMPA baris pertama
            firstRow.querySelector('[name="nama_pegawai[]"]').value = p.nama_pegawai;
            firstRow.querySelector('[name="golongan[]"]').value = displayGol || '';
            firstRow.querySelector('[name="jabatan[]"]').value = '';
            firstRow.querySelector('[name="pegawai_id[]"]').value = p.id || '';
        } else {
            // Kalau sudah ada isinya, BUAT baris baru
            tambahPegawai(p.nama_pegawai, displayGol || '', '', p.id || '');
        }

        dropdown.value = ''; // Reset pilihan
        hitungOtomatis();
    }
};

// --- 5. LOGIKA EDIT DATA (LOAD DARI SERVER) ---
document.addEventListener('DOMContentLoaded', async () => {
    // Inisialisasi Flatpickr pada semua input tanggal
    flatpickr('.flatpickr-date', {
        dateFormat: 'Y-m-d',       // Value internal (untuk server/database)
        altInput: true,             // Tampilkan input alternatif ke user
        altFormat: 'd/m/Y',        // Format tampilan: dd/mm/yyyy
        locale: 'id',              // Bahasa Indonesia
        allowInput: true,           // Boleh ketik manual
        onChange: function () {
            hitungOtomatis();       // Trigger recalculate saat tanggal berubah
        }
    });

    // await loadSppdDropdown();

    // Load dropdown KAK untuk auto-fill Maksud Dinas
    try {
        const resKak = await fetch('/api/kak/all');
        const dataKak = await resKak.json();
        const selectKak = document.getElementById('selectKak');
        if (selectKak && dataKak.success && dataKak.data) {
            dataKak.data.forEach(kak => {
                const opt = document.createElement('option');
                opt.value = kak.id;
                opt.textContent = kak.judul_kegiatan;
                opt.dataset.judul = kak.judul_kegiatan;
                selectKak.appendChild(opt);
            });
            // Event: Auto-fill maksud_dinas saat KAK dipilih
            selectKak.addEventListener('change', function () {
                const selected = this.options[this.selectedIndex];
                const maksudEl = document.querySelector('[name="maksud_dinas"]');
                if (this.value && maksudEl) {
                    maksudEl.value = selected.dataset.judul || '';
                }
            });
        }
    } catch (err) {
        console.error('Gagal load KAK:', err);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    const formatDate = (d) => (d && d !== 'null' && !d.startsWith('0000') ? d.split('T')[0] : '');

    if (editId) {
        // --- MODE EDIT ---
        document.querySelector('h4').innerText = 'Edit Rincian Biaya';
        document.getElementById('id_edit').value = editId;

        fetch(`/api/perjadin/view/${editId}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data) return Swal.fire('Error!', 'Data tidak ditemukan!', 'error');

                // GUARD: Blokir edit jika SPJ sudah diupload
                if (data.status_spj) {
                    Swal.fire({
                        title: 'Data Terkunci! 🔒',
                        text: 'Perjadin ini sudah memiliki SPJ yang diupload. Data tidak bisa diedit.',
                        icon: 'warning',
                        confirmButtonColor: '#d33',
                        confirmButtonText: 'Kembali ke Daftar',
                    }).then(() => {
                        window.location.href = '/daftar_perjadin.html';
                    });
                    return;
                }

                // Helper isi form
                const setVal = (name, val) => {
                    const el = document.getElementsByName(name)[0];
                    if (el) el.value = val;
                };

                // Helper: set tanggal via Flatpickr API
                const setFlatpickrDate = (name, val) => {
                    const el = document.getElementsByName(name)[0];
                    if (el && el._flatpickr && val) {
                        el._flatpickr.setDate(val, true);
                    }
                };

                setVal('no_surat_tugas', data.no_surat_tugas);
                setFlatpickrDate('tgl_surat_tugas', formatDate(data.tgl_surat_tugas));
                setVal('menimbang', data.menimbang || '');
                setVal('dasar', data.dasar || '');
                setVal('uraian_tugas', data.uraian_tugas || '');
                setVal('maksud_dinas', data.maksud_dinas);
                setVal('tujuan', data.tujuan);
                setVal('jenis_transportasi', data.jenis_transportasi);
                setFlatpickrDate('tgl_berangkat', formatDate(data.tgl_berangkat));
                setFlatpickrDate('tgl_pulang', formatDate(data.tgl_pulang));

                setVal('uang_harian', formatRupiah(Math.round(Number(data.uang_harian) || 0).toString()));
                setVal('ket_harian', data.ket_harian || '');
                setVal('biaya_bbm', formatRupiah(Math.round(Number(data.biaya_bbm) || 0).toString()));
                setVal('ket_bbm', data.ket_bbm || '');
                setVal('biaya_tol', formatRupiah(Math.round(Number(data.biaya_tol) || 0).toString()));
                setVal('ket_tol', data.ket_tol || '');
                setVal('biaya_tiket', formatRupiah(Math.round(Number(data.biaya_tiket) || 0).toString()));
                setVal('ket_tiket', data.ket_tiket || '');
                setVal('biaya_parkir', formatRupiah(Math.round(Number(data.biaya_parkir) || 0).toString()));
                setVal('ket_parkir', data.ket_parkir || '');
                setVal('tarif_hotel', formatRupiah(Math.round(Number(data.tarif_hotel) || 0).toString()));

                setVal('nama_hotel', data.nama_hotel || '');
                setFlatpickrDate('tgl_checkin', formatDate(data.tgl_checkin));
                setFlatpickrDate('tgl_checkout', formatDate(data.tgl_checkout));

                // Bersihkan baris pegawai lama, isi dengan yang baru
                const container = document.getElementById('pegawai-container');
                container.innerHTML = '';

                // Buat map dari pivot table untuk enrichment ID
                const pivotMap = {};
                if (data.pegawai_list && data.pegawai_list.length > 0) {
                    data.pegawai_list.forEach((peg) => {
                        pivotMap[peg.nama_pegawai.trim().toUpperCase()] = peg;
                    });
                }

                // Baca SEMUA nama dari kolom teks (termasuk manual)
                const splitAman = (str) => {
                    if (!str) return [];
                    if (str.includes('|||')) return str.split('|||').map((s) => s.trim());
                    if (str.includes('|')) return str.split('|').map((s) => s.trim());
                    return [str.trim()];
                };

                const namaArr = splitAman(data.nama_pegawai);
                const golArr = splitAman(data.golongan);
                const jabArr = splitAman(data.jabatan);

                if (namaArr.length > 0 && namaArr[0] !== '') {
                    namaArr.forEach((n, i) => {
                        const key = n.trim().toUpperCase();
                        const pivotData = pivotMap[key];
                        if (pivotData) {
                            // Pegawai dari database → punya ID
                            const displayGol = pivotData.pangkat ? `${pivotData.pangkat} (${pivotData.golongan})` : (golArr[i] || '');
                            tambahPegawai(n, displayGol, jabArr[i] || '', pivotData.id);
                        } else {
                            // Pegawai manual → tanpa ID
                            tambahPegawai(n, golArr[i] || '', jabArr[i] || '');
                        }
                    });
                } else {
                    tambahPegawai();
                }
                setTimeout(hitungOtomatis, 500);
            })
            .catch((err) => console.error('Gagal load edit:', err));
    } else {
        // --- MODE INPUT BARU ---
        tambahPegawai(); // Tambah 1 baris kosong di awal
    }
});

// --- 6. EVENT LISTENER FORMAT RUPIAH & HITUNG ---
document.addEventListener('input', (e) => {
    if (['uang_harian', 'biaya_bbm', 'biaya_tol', 'biaya_tiket', 'biaya_parkir', 'tarif_hotel'].includes(e.target.name)) {
        e.target.value = formatRupiah(e.target.value);
    }
    hitungOtomatis();
});

// --- 7. SUBMIT FORM (SIMPAN) ---
document.getElementById('perjadinForm').onsubmit = async function (e) {
    e.preventDefault();

    // 1. AMBIL NILAI UNTUK VALIDASI LOGIKA
    const tglBerangkat = document.querySelector('input[name="tgl_berangkat"]').value;
    const tglPulang = document.querySelector('input[name="tgl_pulang"]').value;
    const tglCheckin = document.querySelector('input[name="tgl_checkin"]').value;
    const tglCheckout = document.querySelector('input[name="tgl_checkout"]').value;
    const noSurat = document.querySelector('input[name="no_surat_tugas"]').value;
    const listPegawai = document.querySelectorAll('input[name="nama_pegawai[]"]');

    // --- MULAI BLOK VALIDASI ---

    // A. Cek Nomor Surat
    if (!noSurat.trim()) {
        return Swal.fire('Oops...', 'Nomor Surat Tugas tidak boleh kosong!', 'warning');
    }

    // B. Cek Minimal 1 Pegawai
    let adaPegawai = false;
    listPegawai.forEach((input) => {
        if (input.value.trim() !== '') adaPegawai = true;
    });
    if (!adaPegawai) {
        return Swal.fire('Oops...', 'Minimal harus ada 1 nama pegawai yang berangkat!', 'warning');
    }

    // C. Logika Tanggal Perjalanan (Pulang gak boleh sebelum berangkat)
    if (tglBerangkat && tglPulang) {
        if (new Date(tglPulang) < new Date(tglBerangkat)) {
            return Swal.fire('Tanggal Salah!', 'Tanggal Pulang tidak boleh lebih awal dari Tanggal Berangkat!', 'error');
        }
    }

    // D. Logika Tanggal Hotel (Checkout gak boleh sebelum Checkin)
    if (tglCheckin && tglCheckout) {
        if (new Date(tglCheckout) < new Date(tglCheckin)) {
            return Swal.fire('Tanggal Salah!', 'Tanggal Check-out hotel tidak boleh lebih awal dari Check-in!', 'error');
        }
    }

    // --- AKHIR BLOK VALIDASI ---

    // Konfirmasi sebelum simpan
    const confirm = await Swal.fire({
        title: 'Simpan Data Perjadin?',
        text: 'Pastikan data rincian biaya dan tanggal sudah benar.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Simpan!',
        cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return; // Kalau user klik batal, hentikan proses

    // 2. PROSES PENGIRIMAN DATA
    const formData = new FormData(this);
    const searchParams = new URLSearchParams();

    // Loop data biar array (nama_pegawai[]) terkirim benar
    for (const pair of formData.entries()) {
        searchParams.append(pair[0], pair[1]);
    }

    try {
        const response = await fetch('/api/perjadin/save', {
            method: 'POST',
            body: searchParams,
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                title: 'Berhasil!',
                text: result.message,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                window.location.href = '/daftar_perjadin.html'; // Pindah halaman setelah animasi selesai
            });
        } else {
            Swal.fire('Gagal!', result.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error!', 'Terjadi kesalahan koneksi server.', 'error');
    }
};
