// js/sppd-handler.js

// Variabel Global
let currentEditId = null;
let pegawaiCache = []; // Simpan data pegawai sementara

document.addEventListener('DOMContentLoaded', () => {
    const formSppd = document.getElementById('formSppd');

    // 1. [BARU] INISIALISASI DROPDOWN PEGAWAI
    initDropdownPegawai();
    loadPejabat();
    initDropdownRab();
    // 2. CEK MODE EDIT SAAT HALAMAN DIMUAT
    const urlParams = new URLSearchParams(window.location.search);
    currentEditId = urlParams.get('edit');

    if (currentEditId) {
        enableEditMode(currentEditId);
    }

    // 3. LISTENER HITUNG OTOMATIS
    const inBerangkat = document.querySelector('input[name="tgl_berangkat"]');
    const inKembali = document.querySelector('input[name="tgl_kembali"]');
    if (inBerangkat && inKembali) {
        inBerangkat.addEventListener('change', hitungLamaPerjalanan);
        inKembali.addEventListener('change', hitungLamaPerjalanan);
    }

    // 4. HANDLE SUBMIT FORM
    if (formSppd) {
        formSppd.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(formSppd);
            const data = Object.fromEntries(formData.entries());

            const url = currentEditId ? `/api/sppd/update/${currentEditId}` : '/api/sppd/save';
            const method = currentEditId ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                    isiTemplateCetak(data);
                    setTimeout(() => {
                        window.print();
                        if (currentEditId) {
                            Swal.fire({
                                title: 'Cetak Selesai',
                                text: 'Kembali ke halaman Riwayat SPPD?',
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, Kembali',
                                cancelButtonText: 'Tetap di Sini'
                            }).then((r) => {
                                if (r.isConfirmed) window.location.href = '/riwayat_sppd.html';
                            });
                        }
                    }, 500);
                } else {
                    Swal.fire('Gagal!', result.message, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
            }
        });
    }
});

// --- [BARU] FUNGSI AUTO FILL DARI DB ---
async function initDropdownPegawai() {
    const select = document.getElementById('pilih_pegawai');
    if (!select) return;

    try {
        // Panggil API dari pegawaiRoutes yang baru kita update
        const response = await fetch('/api/pegawai/data/all');
        const result = await response.json();

        if (result.success && result.data) {
            pegawaiCache = result.data;

            // Grouping berdasarkan Kategori
            const groups = {};
            pegawaiCache.forEach((p, index) => {
                if (!groups[p.kategori]) groups[p.kategori] = [];
                groups[p.kategori].push({ ...p, originalIndex: index });
            });

            // Render ke Dropdown
            for (const [kategori, list] of Object.entries(groups)) {
                const groupEl = document.createElement('optgroup');
                groupEl.label = kategori;

                list.forEach((item) => {
                    const option = document.createElement('option');
                    option.value = item.originalIndex;
                    option.innerText = item.nama_pegawai;
                    groupEl.appendChild(option);
                });
                select.appendChild(groupEl);
            }
        }
    } catch (error) {
        console.error('Gagal ambil master pegawai:', error);
    }

    // Event Listener: Saat user memilih nama
    select.addEventListener('change', function () {
        const idx = this.value;
        if (idx !== '') {
            const p = pegawaiCache[idx];

            // Format Nama + NIP
            let namaLengkap = p.nama_pegawai;
            if (p.nip_nik && p.nip_nik !== '-' && p.nip_nik.length > 5) {
                namaLengkap += ` / ${p.nip_nik}`;
            }

            // Format Pangkat + Golongan
            let pangkatLengkap = p.pangkat || '';
            if (p.golongan) {
                pangkatLengkap += ` (${p.golongan})`;
            }

            // Isi Form (Target ID input_nama, input_pangkat, input_jabatan)
            const elNama = document.getElementById('input_nama');
            const elPangkat = document.getElementById('input_pangkat');
            const elJabatan = document.getElementById('input_jabatan');

            if (elNama) elNama.value = namaLengkap;
            if (elPangkat) elPangkat.value = pangkatLengkap;
            if (elJabatan) elJabatan.value = p.jabatan || '';
        }
    });
}

async function loadPejabat() {
    // Kalau lagi mode edit, jangan timpa data yang sudah tersimpan
    // Kecuali Mas mau force update PPK terbaru
    if (currentEditId) return;

    try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.data) {
            const s = json.data;
            // Isi Inputan PPK Otomatis
            const elNama = document.querySelector('input[name="ppk_nama"]');
            const elNip = document.querySelector('input[name="ppk_nip"]');

            if (elNama) elNama.value = s.ppk_nama;
            if (elNip) elNip.value = s.ppk_nip;
        }
    } catch (err) {
        console.error('Gagal load setting pejabat');
    }
}

// --- FUNGSI MAPPING DATA KE CETAKAN (SAFE MODE) ---
function isiTemplateCetak(data) {
    const val = (txt) => txt || '-';
    const tgl = (txt) => (txt ? formatTanggalIndo(txt) : '-');

    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    // HALAMAN 1
    set('p_nomor_st', 'Nomor: ' + val(data.nomor_st));
    set('p_nomor_st_header', val(data.nomor_st));
    set('p_ppk', val(data.ppk_nama) + ' / ' + val(data.ppk_nip));
    set('p_pegawai', val(data.nama_pegawai));
    set('p_pangkat', 'a. ' + val(data.pangkat_gol));
    set('p_jabatan', 'b. ' + val(data.jabatan));
    set('p_tingkat', 'c. ' + val(data.tingkat_biaya));
    set('p_maksud', val(data.maksud_dinas));
    set('p_angkutan', val(data.angkutan));
    set('p_berangkat', 'a. ' + val(data.tempat_berangkat));
    set('p_tujuan', 'b. ' + val(data.tempat_tujuan));
    set('p_lama', 'a. ' + val(data.lama_hari));
    set('p_tgl_berangkat', 'b. ' + tgl(data.tgl_berangkat));
    set('p_tgl_kembali', 'c. ' + tgl(data.tgl_kembali));

    // Pengikut
    set('p_pengikut_nama', val(data.pengikut_nama));
    set('p_pengikut_nip', val(data.pengikut_nip));
    set('p_pengikut_ket', val(data.pengikut_ket));
    // Fallback lama
    set('p_pengikut', val(data.pengikut_nama) + ' / ' + val(data.pengikut_nip));

    set('p_instansi', 'a. ' + val(data.instansi));
    set('p_akun', 'b. ' + val(data.akun_anggaran));
    set('p_lain', val(data.keterangan_lain));

    set('p_nama_ppk_bawah', val(data.ppk_nama));
    set('p_nip_ppk_bawah', 'NIP. ' + val(data.ppk_nip));
    set('p_tgl_cetak', 'Pada tanggal: ' + tgl(data.tgl_surat));

    // HALAMAN 2
    set('p_back_nomor_st_header', val(data.nomor_st));
    set('p_back_tgl_surat_header', tgl(data.tgl_surat));
    set('p_back_berangkat_1', val(data.tempat_berangkat));
    set('p_back_tujuan_1', val(data.tempat_tujuan));
    set('p_back_tgl_1', tgl(data.tgl_berangkat));
    set('p_back_tujuan_2', val(data.tempat_tujuan));
    set('p_back_tgl_2', tgl(data.tgl_berangkat));
    set('p_back_berangkat_2', val(data.tempat_tujuan));
    set('p_back_ke_2', val(data.tempat_berangkat));
    set('p_back_tgl_3', tgl(data.tgl_kembali));
    set('p_back_tgl_akhir', tgl(data.tgl_kembali));
    set('p_back_nama_ppk', val(data.ppk_nama));
    set('p_back_nip_ppk', 'NIP. ' + val(data.ppk_nip));
    set('p_back_nama_ppk_2', val(data.ppk_nama));
    set('p_back_nip_ppk_2', 'NIP. ' + val(data.ppk_nip));
}

// --- FUNGSI LAINNYA ---
async function enableEditMode(id) {
    try {
        document.querySelector('.card-header small').innerHTML = `<b>MODE EDIT:</b> Revisi Data #${id}`;
        const response = await fetch(`/api/sppd/view/${id}`);
        const result = await response.json();

        if (result.success && result.data) {
            const d = result.data;
            for (const key in d) {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'date' && d[key]) {
                        input.value = d[key].split('T')[0];
                    } else {
                        input.value = d[key];
                    }
                }
            }
            hitungLamaPerjalanan();

            // ---> MANTRA AUTO-PRINT YANG BENAR <---
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('action') === 'print') {
                // 1. PINDAHKAN DATA KE TEMPLATE CETAKAN DULU
                isiTemplateCetak(d);

                // 2. BARU PANGGIL JENDELA PRINT
                // Karena datanya sudah dipindah instan, nunggu 1 detik aja (1000ms) udah cukup banget
                setTimeout(() => {
                    window.print();
                }, 1000);
            }
            // ---------------------------------------------
        }
    } catch (err) {
        console.error('Gagal load data edit:', err);
    }
}

function terbilang(angka) {
    const bil = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (angka < 12) return bil[angka];
    else if (angka < 20) return terbilang(angka - 10) + ' Belas';
    else if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10);
    else if (angka < 200) return 'Seratus ' + terbilang(angka - 100);
    else if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100);
    return angka;
}

function hitungLamaPerjalanan() {
    const inputBerangkat = document.querySelector('input[name="tgl_berangkat"]');
    const inputKembali = document.querySelector('input[name="tgl_kembali"]');
    const inputLama = document.querySelector('input[name="lama_hari"]');

    if (inputBerangkat.value && inputKembali.value) {
        const tglAwal = new Date(inputBerangkat.value);
        const tglAkhir = new Date(inputKembali.value);

        if (tglAkhir < tglAwal) {
            Swal.fire('Tanggal Salah!', 'Tanggal Kembali tidak boleh sebelum Tanggal Berangkat!', 'error');
            inputKembali.value = '';
            inputLama.value = '';
            return;
        }

        const selisihWaktu = tglAkhir - tglAwal;
        const jumlahHari = Math.round(selisihWaktu / (1000 * 60 * 60 * 24)) + 1;
        const teksTerbilang = terbilang(jumlahHari);
        inputLama.value = `${jumlahHari} (${teksTerbilang}) Hari`;
    }
}
// --- [BARU] FUNGSI INTEGRASI KAK/RAB ---
async function initDropdownRab() {
    const selectRab = document.getElementById('pilih_rab');
    if (!selectRab) return;

    try {
        const response = await fetch('/api/rab/all');
        const data = await response.json();

        // Masukkan data kegiatan ke dalam dropdown
        data.forEach((item) => {
            const option = document.createElement('option');
            option.value = item.id;
            // Kita tampilkan Judul Kegiatan + Nama Kamar Pagu-nya
            option.text = `[RAB] ${item.judul_kegiatan} - ${item.nama_kamar || ''}`;

            // Simpan datanya secara rahasia di atribut dataset
            option.dataset.maksud = item.judul_kegiatan;
            option.dataset.akun = item.nama_kamar || '';
            selectRab.appendChild(option);
        });

        // Event Listener: Apa yang terjadi kalau user milih kegiatannya?
        selectRab.addEventListener('change', function () {
            const selected = this.options[this.selectedIndex];
            const elm_maksud = document.querySelector('textarea[name="maksud_dinas"]');
            const elm_akun = document.querySelector('input[name="akun_anggaran"]');

            if (this.value) {
                // Ssshhh! Sihir Auto-fill bekerja di sini
                elm_maksud.value = selected.dataset.maksud;

                // Kasih warna ijo (Valid) biar user tau kalau ini diisi otomatis
                elm_maksud.classList.add('border-success', 'bg-success-subtle');
            } else {
                // Kalau dikembalikan ke "Ketik Manual", hilangkan warna ijonya
                elm_maksud.value = '';
                elm_akun.value = 'DIPA KPU Tulang Bawang Barat TA 2026';
                elm_maksud.classList.remove('border-success', 'bg-success-subtle');
                elm_akun.classList.remove('border-success', 'bg-success-subtle');
            }
        });
    } catch (err) {
        console.error('Gagal meload data RAB:', err);
    }
}
