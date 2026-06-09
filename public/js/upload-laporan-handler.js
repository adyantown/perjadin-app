document.addEventListener('DOMContentLoaded', () => {
    loadDaftarSPPD();

    // Preview Gambar saat dipilih
    document.getElementById('inputFoto').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('previewImg').src = e.target.result;
                document.getElementById('previewContainer').classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle Submit
    document.getElementById('formLaporan').addEventListener('submit', kirimLaporan);
});

// 1. AMBIL DAFTAR SPPD (Dropdown)
async function loadDaftarSPPD() {
    const select = document.getElementById('pilihSppd');
    try {
        const res = await fetch('/api/sppd/all');
        const json = await res.json();

        if (json.success && json.data.length > 0) {
            select.innerHTML = '<option value="">-- Pilih Kegiatan --</option>';

            // Urutkan dari yg terbaru
            json.data.forEach((item) => {
                // Tampilkan Nomor Surat & Tujuan biar jelas
                const label = `${item.nomor_st} - Ke: ${item.tempat_tujuan} (${item.nama_pegawai})`;
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = label;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">Belum ada data SPPD</option>';
        }
    } catch (error) {
        console.error('Gagal load SPPD:', error);
        select.innerHTML = '<option value="">Gagal memuat data</option>';
    }
}

// 2. AMBIL LOKASI (GPS)
function ambilLokasi() {
    const status = document.getElementById('statusLokasi');
    const btn = document.querySelector('button[onclick="ambilLokasi()"]');

    if (!navigator.geolocation) {
        status.innerHTML = '<span class="text-danger">❌ Browser tidak support GPS.</span>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mencari...';
    status.innerHTML = '<span class="text-warning">⏳ Sedang mendeteksi satelit...</span>';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;

            document.getElementById('inputLat').value = lat;
            document.getElementById('inputLong').value = long;

            status.innerHTML = `
                <div class="alert alert-success py-2 mb-0">
                    <strong>✅ Lokasi Terkunci!</strong><br>
                    <small>Lat: ${lat.toFixed(6)}, Long: ${long.toFixed(6)}</small><br>
                    <a href="https://www.google.com/maps?q=${lat},${long}" target="_blank" class="fw-bold small">Lihat di Peta</a>
                </div>
            `;
            btn.innerHTML = 'Update Lokasi';
            btn.disabled = false;
        },
        (error) => {
            let msg = 'Gagal mengambil lokasi.';
            if (error.code == 1) msg = '❌ Akses Ditolak. Izinkan lokasi di browser!';
            if (error.code == 2) msg = '❌ Sinyal GPS lemah/tidak tersedia.';
            if (error.code == 3) msg = '❌ Waktu habis (Timeout).';

            status.innerHTML = `<span class="text-danger fw-bold">${msg}</span>`;
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-geo-fill me-1"></i> Coba Lagi';
        },
        { enableHighAccuracy: true, timeout: 10000 }, // Opsi GPS Akurasi Tinggi
    );
}

// 3. KIRIM DATA (UPLOAD)
async function kirimLaporan(e) {
    e.preventDefault();

    // Validasi: Wajib ada lokasi!
    const lat = document.getElementById('inputLat').value;
    if (!lat) {
        Swal.fire('Lokasi Diperlukan!', 'Wajib ambil lokasi dulu sebagai bukti kehadiran!', 'warning');
        return;
    }

    const btn = document.getElementById('btnSubmit');
    const txtAwal = btn.innerHTML;

    // Efek Loading
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mengirim Bukti...';

    const formData = new FormData(this);

    try {
        const res = await fetch('/api/dokumentasi/upload', {
            method: 'POST',
            body: formData,
        });
        const json = await res.json();

        if (json.success) {
            // Sukses
            await Swal.fire({ title: 'Berhasil!', text: json.message, icon: 'success', timer: 1500, showConfirmButton: false });
            window.location.href = '/index.html'; // Balik ke dashboard
        } else {
            Swal.fire('Gagal!', json.message, 'error');
            btn.disabled = false;
            btn.innerHTML = txtAwal;
        }
    } catch (error) {
        Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
        console.error(error);
        btn.disabled = false;
        btn.innerHTML = txtAwal;
    }
}
