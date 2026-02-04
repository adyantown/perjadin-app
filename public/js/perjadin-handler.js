// Gunakan yang ini saja, sudah mencakup Edit dan Manual
function tambahPegawai(nama = '', gol = '', jab = '') {
    const container = document.getElementById('pegawai-container');
    const htmlBaris = `
        <div class="grid pegawai-row" style="margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
            <div>
                <label>Nama Pegawai</label>
                <input type="text" name="nama_pegawai[]" value="${nama}" required>
            </div>
            <div>
                <label>Golongan</label>
                <input type="text" name="golongan[]" value="${gol}" placeholder="Contoh: IV/a">
            </div>
            <div>
                <label>Jabatan</label>
                <input type="text" name="jabatan[]" value="${jab}" required>
            </div>
            <div style="display: flex; align-items: flex-end;">
                <button type="button" class="btn-remove" onclick="hapusBaris(this)" 
                    style="background:#e74c3c; width:auto; margin:0; padding: 8px 15px; color:white; border:none; border-radius:4px; cursor:pointer;">Hapus</button>
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', htmlBaris);
    updateTombolHapus();
    hitungOtomatis();
}

function hapusBaris(btn) {
    btn.closest('.pegawai-row').remove();
    updateTombolHapus();
    hitungOtomatis();
}

function updateTombolHapus() {
    const rows = document.querySelectorAll('.pegawai-row');
    rows.forEach((row) => {
        row.querySelector('.btn-remove').style.display = rows.length === 1 ? 'none' : 'block';
    });
}

// --- 4. MODE EDIT ---
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');

const formatDate = (d) => (d && d !== 'null' && !d.startsWith('0000') && !d.startsWith('1899') ? d.split('T')[0] : '');

if (editId) {
    document.querySelector('h2').innerText = 'Edit Data Perjalanan Dinas';
    fetch(`/api/perjadin/get-perjadin/${editId}`)
        .then((res) => res.json())
        .then((data) => {
            document.getElementById('id_edit').value = editId;
            document.getElementsByName('no_surat_tugas')[0].value = data.no_surat_tugas;
            document.getElementsByName('tgl_surat_tugas')[0].value = formatDate(data.tgl_surat_tugas);
            document.getElementsByName('maksud_dinas')[0].value = data.maksud_dinas;
            document.getElementsByName('tujuan')[0].value = data.tujuan;
            document.getElementsByName('jenis_transportasi')[0].value = data.jenis_transportasi;
            document.getElementsByName('tgl_berangkat')[0].value = formatDate(data.tgl_berangkat);
            document.getElementsByName('tgl_pulang')[0].value = formatDate(data.tgl_pulang);

            // Format angka saat load
            document.getElementsByName('uang_harian')[0].value = formatRupiah((data.uang_harian || 0).toString());
            document.getElementsByName('biaya_transportasi')[0].value = formatRupiah((data.biaya_transportasi || 0).toString());
            document.getElementsByName('tarif_hotel')[0].value = formatRupiah((data.tarif_hotel || 0).toString());

            document.getElementsByName('nama_hotel')[0].value = data.nama_hotel || '';
            document.getElementsByName('tgl_checkin')[0].value = formatDate(data.tgl_checkin);
            document.getElementsByName('tgl_checkout')[0].value = formatDate(data.tgl_checkout);

            const container = document.getElementById('pegawai-container');
            container.innerHTML = '';
            const namaArr = data.nama_pegawai ? data.nama_pegawai.split(', ') : [''];
            const golArr = data.golongan ? data.golongan.split(', ') : [''];
            const jabArr = data.jabatan ? data.jabatan.split(', ') : [''];

            namaArr.forEach((n, i) => tambahPegawai(n, golArr[i] || '', jabArr[i] || ''));
            setTimeout(hitungOtomatis, 300);
        });
}

// --- 5. EVENT LISTENERS ---
document.addEventListener('input', (e) => {
    if (e.target.name === 'uang_harian' || e.target.name === 'biaya_transportasi' || e.target.name === 'tarif_hotel') {
        e.target.value = formatRupiah(e.target.value);
    }
    hitungOtomatis();
});

// --- 6. PROSES SIMPAN (SOLUSI NAMA HILANG) ---
document.getElementById('perjadinForm').onsubmit = async function (e) {
    e.preventDefault();

    // Gunakan URLSearchParams secara manual agar array [] terkirim dengan benar
    const formData = new FormData(this);
    const searchParams = new URLSearchParams();

    for (const pair of formData.entries()) {
        searchParams.append(pair[0], pair[1]);
    }

    try {
        const response = await fetch('/api/perjadin/save', {
            method: 'POST',
            body: searchParams, // Mengirim data yang sudah mendukung multiple values
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            window.location.href = '/daftar.html';
        } else {
            alert('Gagal: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Koneksi ke server terputus.');
    }
};

// Fungsi ini dipanggil saat nama di dropdown dipilih
// 1. Definisikan variabel data di luar agar bisa diakses semua fungsi
window.dataPegawai = [];

// 2. Gunakan window.namaFungsi agar PASTI terbaca oleh HTML onclick
window.loadPegawai = async function (kategori) {
    console.log('Tombol diklik, mencari kategori:', kategori);
    try {
        const response = await fetch(`/api/pegawai/${kategori}`);

        // Cek apakah response oke
        if (!response.ok) throw new Error('Gagal mengambil data dari server');

        window.dataPegawai = await response.json();
        console.log('Data diterima:', window.dataPegawai);

        const dropdown = document.getElementById('selectNama');
        dropdown.innerHTML = '<option value="">-- Pilih Nama dari Hasil Filter --</option>';

        window.dataPegawai.forEach((p) => {
            const option = document.createElement('option');
            option.value = p.nip_nik;
            option.textContent = p.nama_pegawai;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Error: ' + error.message);
    }
};

// Fungsi ini yang memindahkan data dari dropdown ke field input
window.tambahPegawaiOtomatis = function () {
    const dropdown = document.getElementById('selectNama');
    const nipTerpilih = dropdown.value;

    if (!nipTerpilih) return;

    const p = window.dataPegawai.find((peg) => String(peg.nip_nik) === String(nipTerpilih));

    if (p) {
        const displayGol = p.pangkat ? `${p.pangkat} (${p.golongan})` : p.golongan;

        // --- LOGIKA PINTAR DIMULAI DISINI ---
        const rows = document.querySelectorAll('.pegawai-row');
        const firstRow = rows[0];

        // Cek apakah baris pertama masih kosong (nama_pegawai belum diisi)
        const firstInputNama = firstRow ? firstRow.querySelector('[name="nama_pegawai[]"]') : null;

        if (firstRow && (!firstInputNama.value || firstInputNama.value.trim() === '')) {
            // Jika baris pertama kosong, langsung isi field yang ada
            console.log('Menimpa baris pertama yang kosong...');
            firstRow.querySelector('[name="nama_pegawai[]"]').value = p.nama_pegawai;
            firstRow.querySelector('[name="golongan[]"]').value = displayGol;
            firstRow.querySelector('[name="jabatan[]"]').value = p.jabatan || '';
        } else {
            // Jika baris pertama sudah ada isinya, baru tambah baris baru di bawah
            console.log('Baris pertama sudah terisi, menambah baris baru...');
            tambahPegawai(p.nama_pegawai, displayGol, p.jabatan || '');
        }
        // --- LOGIKA PINTAR SELESAI ---

        dropdown.value = ''; // Reset dropdown
        hitungOtomatis(); // Update total biaya
    }
};

// Jangan lupa fungsi hapusnya!
function hapusBaris(btn) {
    btn.closest('.pegawai-row').remove();
}

// Tambahkan satu baris kosong saat halaman pertama kali dibuka
if (!editId) {
    tambahPegawai();
}
