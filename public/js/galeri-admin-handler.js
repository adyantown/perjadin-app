document.addEventListener('DOMContentLoaded', () => {
    loadGaleri();
});

async function loadGaleri() {
    const container = document.getElementById('galleryContainer');

    try {
        const res = await fetch('/api/dokumentasi/galeri');
        const json = await res.json();

        container.innerHTML = ''; // Bersihkan loading

        if (json.success && json.data.length > 0) {
            json.data.forEach((item) => {
                const card = renderCard(item);
                container.innerHTML += card;
            });
        } else {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="text-muted display-1"><i class="bi bi-image"></i></div>
                    <h5 class="text-muted">Belum ada dokumentasi yang diupload.</h5>
                </div>
            `;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-danger text-center">Gagal memuat data galeri.</p>';
    }
}

function renderCard(item) {
    // Format Waktu Upload (misal: 20 Feb 2026, 14:30)
    const tgl = new Date(item.created_at);
    const tglString = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const jamString = tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Inisial Nama User (Misal: Adyanto -> A)
    const inisial = (item.uploaded_by || 'U').charAt(0).toUpperCase();

    // Link Google Maps
    // Format: https://www.google.com/maps?q=-4.123,105.123
    const mapLink = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;

    return `
    <div class="col-md-4 col-lg-3">
        <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
            
            <div class="position-relative">
                <img src="/uploads/${item.foto_path}" class="foto-kegiatan" 
                     onclick="previewFoto('/uploads/${item.foto_path}')"
                     alt="Dokumentasi">
                <span class="badge bg-dark bg-opacity-50 position-absolute top-0 end-0 m-2">
                    <i class="bi bi-geo-alt-fill text-danger"></i> GPS Ada
                </span>
            </div>

            <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                    <div class="user-avatar me-2">${inisial}</div>
                    <div class="small">
                        <div class="fw-bold text-dark">${item.uploaded_by}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">${tglString} • ${jamString} WIB</div>
                    </div>
                </div>

                <h6 class="card-title fw-bold text-primary mb-1 text-truncate" title="${item.maksud_dinas}">
                    ${item.maksud_dinas || 'Kegiatan Tanpa Judul'}
                </h6>
                <p class="card-text small text-muted mb-2">
                    <i class="bi bi-pin-map"></i> ${item.tempat_tujuan}<br>
                    <span class="badge bg-light text-secondary border border-secondary text-truncate" style="max-width: 100%;">
                        ST: ${item.nomor_st}
                    </span>
                </p>
                
                <p class="small fst-italic border-start border-3 ps-2 text-secondary bg-light py-1">
                    "${item.keterangan || 'Tidak ada keterangan tambahan.'}"
                </p>
            </div>

            <div class="card-footer bg-white border-0 pt-0 pb-3">
                <div class="d-flex justify-content-between">
                    <a href="${mapLink}" target="_blank" class="btn btn-outline-primary btn-sm rounded-pill w-100 me-1">
                        <i class="bi bi-map"></i> Peta
                    </a>
                    <button onclick="hapusFoto(${item.id})" class="btn btn-outline-danger btn-sm rounded-circle" title="Hapus Foto">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>

        </div>
    </div>
    `;
}

// Fungsi Hapus Foto
async function hapusFoto(id) {
    // 1. Munculkan Popup Konfirmasi Keren
    const result = await Swal.fire({
        title: 'Yakin ingin menghapus?',
        text: 'Foto dokumentasi ini akan hilang permanen lho!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#bb2d3b', // Warna merah KPU
        cancelButtonColor: '#6c757d', // Warna abu-abu
        confirmButtonText: '<i class="bi bi-trash"></i> Ya, Hapus!',
        cancelButtonText: 'Batal',
        reverseButtons: true, // Posisi tombol batal di kiri
    });

    // 2. Jika user klik "Ya, Hapus!"
    if (result.isConfirmed) {
        try {
            // Tembak API untuk hapus
            const res = await fetch(`/api/dokumentasi/delete/${id}`, { method: 'DELETE' });
            const json = await res.json();

            if (json.success) {
                // Munculkan notifikasi sukses
                Swal.fire({
                    title: 'Terhapus!',
                    text: 'Dokumentasi berhasil dihilangkan.',
                    icon: 'success',
                    timer: 1500, // Otomatis tutup dalam 1.5 detik
                    showConfirmButton: false,
                });
                loadGaleri(); // Reload grid foto [cite: 520, 521]
            } else {
                Swal.fire('Gagal!', json.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error!', 'Terjadi kesalahan koneksi.', 'error');
        }
    }
}

// Fungsi Preview Gambar Besar
function previewFoto(url) {
    document.getElementById('imgPreviewFull').src = url;
    const modal = new bootstrap.Modal(document.getElementById('modalPreview'));
    modal.show();
}
