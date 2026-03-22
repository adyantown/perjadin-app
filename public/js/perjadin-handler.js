// public/js/perjadin-handler.js
// VERSI FINAL & RAPI

// --- 1. FUNGSI TAMBAH PEGAWAI (TAMPILAN BOOTSTRAP CARD) ---
function tambahPegawai(nama = '', gol = '', jab = '') {
    const container = document.getElementById('pegawai-container');

    // HTML Template dengan Card Bootstrap (Ini yang bikin rapi!)
    const htmlBaris = `
        <div class="pegawai-row card mb-3 bg-light border-0 shadow-sm">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-danger m-0">
                        <i class="bi bi-person-badge-fill me-1"></i> Data Pegawai
                    </h6>
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove" onclick="hapusBaris(this)" title="Hapus Baris Ini">
                        <i class="bi bi-trash"></i> Hapus
                    </button>
                </div>
                
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
async function loadSppdDropdown() {
    const select = document.getElementById('selectSppd');
    try {
        const res = await fetch('/api/sppd/all');
        const json = await res.json();

        if (json.success && json.data) {
            sppdCache = json.data; // Simpan ke wadah
            select.innerHTML = '<option value="">-- Pilih Surat Tugas dari SPPD --</option>';

            const uniqueST = [];

            json.data.forEach((item) => {
                if (!uniqueST.includes(item.nomor_st)) {
                    uniqueST.push(item.nomor_st);
                    
                    const option = document.createElement('option');
                    option.value = item.nomor_st;
                    
                    // Hitung jumlah rombongan
                    const rombonganCount = json.data.filter(s => s.nomor_st === item.nomor_st).length;
                    
                    option.textContent = `${item.nomor_st} (Ke: ${item.tempat_tujuan} - ${rombonganCount} Orang)`;
                    select.appendChild(option);
                }
            });
        }
    } catch (e) {
        console.error('Gagal meload SPPD:', e);
        select.innerHTML = '<option value="">Gagal memuat data</option>';
    }
}

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
            firstRow.querySelector('[name="jabatan[]"]').value = p.jabatan || '';
        } else {
            // Kalau sudah ada isinya, BUAT baris baru
            tambahPegawai(p.nama_pegawai, displayGol || '', p.jabatan || '');
        }

        dropdown.value = ''; // Reset pilihan
        hitungOtomatis();
    }
};

// --- 5. LOGIKA EDIT DATA (LOAD DARI SERVER) ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadSppdDropdown();
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
                if (!data) return alert('Data tidak ditemukan!');

                // Helper isi form
                const setVal = (name, val) => {
                    const el = document.getElementsByName(name)[0];
                    if (el) el.value = val;
                };

                setVal('no_surat_tugas', data.no_surat_tugas);
                setVal('tgl_surat_tugas', formatDate(data.tgl_surat_tugas));
                setVal('maksud_dinas', data.maksud_dinas);
                setVal('tujuan', data.tujuan);
                setVal('jenis_transportasi', data.jenis_transportasi);
                setVal('tgl_berangkat', formatDate(data.tgl_berangkat));
                setVal('tgl_pulang', formatDate(data.tgl_pulang));

                setVal('uang_harian', formatRupiah((data.uang_harian || 0).toString()));
                setVal('biaya_transportasi', formatRupiah((data.biaya_transportasi || 0).toString()));
                setVal('tarif_hotel', formatRupiah((data.tarif_hotel || 0).toString()));

                setVal('nama_hotel', data.nama_hotel || '');
                setVal('tgl_checkin', formatDate(data.tgl_checkin));
                setVal('tgl_checkout', formatDate(data.tgl_checkout));

                // Bersihkan baris pegawai lama, isi dengan yang baru
                const container = document.getElementById('pegawai-container');
                container.innerHTML = '';

                const splitAman = (str) => {
                    if (!str) return [];

                    // 1. Cek format baru yang paling aman (3 Pipa)
                    if (str.includes('|||')) return str.split('|||').map((s) => s.trim());

                    // 2. Cek format transisi (yang bikin ngacak di gambar ke-2)
                    if (str.includes('|')) return str.split('|').map((s) => s.trim());

                    // 3. Cek format paling jadul (Koma)
                    return str.split(', ');
                };

                const namaArr = splitAman(data.nama_pegawai);
                const golArr = splitAman(data.golongan);
                const jabArr = splitAman(data.jabatan);

                if (namaArr.length > 0 && namaArr[0] !== '') {
                    namaArr.forEach((n, i) => {
                        tambahPegawai(n, golArr[i] || '', jabArr[i] || '');
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
    if (['uang_harian', 'biaya_transportasi', 'tarif_hotel'].includes(e.target.name)) {
        e.target.value = formatRupiah(e.target.value);
    }
    hitungOtomatis();
});

// --- 7. SUBMIT FORM (SIMPAN) ---
document.getElementById('perjadinForm').onsubmit = async function (e) {
    e.preventDefault();
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
            // Pakai SweetAlert2 biar keren
            Swal.fire({
                title: 'Berhasil!',
                text: result.message,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                window.location.href = '/daftar.html'; // Pindah halaman setelah animasi selesai
            });
        } else {
            Swal.fire('Gagal!', result.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error!', 'Terjadi kesalahan koneksi server.', 'error');
    }
};
