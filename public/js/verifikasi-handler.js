document.addEventListener('DOMContentLoaded', loadAntrean);

// FUNGSI 1: AMBIL DATA ANTREAN DARI BACKEND
async function loadAntrean() {
    try {
        const res = await fetch('/api/dokumentasi/semua');
        const json = await res.json();
        const tbody = document.getElementById('tabelVerifikasi');

        if (json.data.length === 0) {
            return tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted"><i class="bi bi-emoji-smile fs-3 d-block mb-2"></i>Belum ada berkas SPJ yang masuk hari ini.</td></tr>';
        }

        tbody.innerHTML = '';
        json.data.forEach(item => {
            // Percantik Tanggal
            const dateObj = new Date(item.waktu_upload);
            const tgl = dateObj.toLocaleDateString('id-ID');
            const jam = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            // Warna Badge Status
            let badgeClass = 'bg-warning text-dark';
            let iconStatus = 'bi-hourglass-split';
            if (item.status === 'ACC') { badgeClass = 'bg-success'; iconStatus = 'bi-check-circle-fill'; }
            if (item.status === 'Revisi') { badgeClass = 'bg-danger'; iconStatus = 'bi-exclamation-triangle-fill'; }

            // Tombol Tindakan
            let aksiBtn = `
                <button onclick="prosesSpj(${item.id}, 'ACC')" class="btn btn-sm btn-success rounded-pill shadow-sm mb-1 px-3 fw-bold"><i class="bi bi-check-lg me-1"></i> ACC</button>
                <button onclick="prosesSpj(${item.id}, 'Revisi')" class="btn btn-sm btn-danger rounded-pill shadow-sm mb-1 px-3 fw-bold"><i class="bi bi-x-lg me-1"></i> Revisi</button>
            `;
            // Kalau udah ACC, tombol hilang ganti tulisan selesai
            if (item.status === 'ACC') {
                aksiBtn = `<span class="text-success fw-bold"><i class="bi bi-check2-all me-1"></i> Tuntas</span>`;
            }

            // Render Baris Tabel
            tbody.innerHTML += `
                <tr>
                    <td class="px-4">
                        <span class="d-block fw-bold text-dark">${tgl}</span>
                        <small class="text-muted"><i class="bi bi-clock"></i> ${jam} WIB</small>
                        <br>
                        <span class="badge bg-light text-secondary border mt-1" style="font-size: 0.7rem;" title="Di-upload oleh">
                            <i class="bi bi-cloud-arrow-up-fill text-primary"></i> ${item.uploaded_by || 'Sistem'}
                        </span>
                    </td>
                    <td>
                        <div class="fw-bold text-primary mb-1"><i class="bi bi-person-fill me-1"></i> ${item.nama_pegawai}</div>
                        <div class="small text-secondary fw-medium">${item.maksud_dinas}</div>
                    </td>
                    <td class="text-center">
                        <a href="${item.file_pdf.replace('/raw/upload/', '/raw/upload/fl_inline/')}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm">
                            <i class="bi bi-file-earmark-pdf-fill me-1"></i> Buka PDF
                        </a>
                    </td>
                    <td class="text-center">
                        <span class="badge ${badgeClass} rounded-pill px-3 py-2"><i class="bi ${iconStatus} me-1"></i> ${item.status}</span>
                    </td>
                    <td class="text-center">
                        <div class="d-grid gap-1 px-2">${aksiBtn}</div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        document.getElementById('tabelVerifikasi').innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Gagal menghubungi server.</td></tr>';
    }
}

// FUNGSI 2: EKSEKUSI ACC ATAU REVISI
async function prosesSpj(id, statusTujuan) {
    let catatan = null;

    // Jika admin klik Revisi (Merah), paksa admin nulis alasan!
    if (statusTujuan === 'Revisi') {
        const { value: textInput } = await Swal.fire({
            title: '<span class="text-danger">Dokumen Kurang Lengkap?</span>',
            html: 'Silakan tulis bagian mana yang harus diperbaiki oleh pegawai:',
            input: 'textarea',
            inputPlaceholder: 'Misal: Kuitansi hotel belum ditandatangani...',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-send-fill me-1"></i> Kirim Catatan',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) return 'Catatan tidak boleh kosong, Kasian pegawainya nanti bingung!'
            }
        });
        if (!textInput) return; // Kalau dibatalkan
        catatan = textInput;
    } else {
        // Jika admin klik ACC (Hijau)
        const confirm = await Swal.fire({
            title: 'Verifikasi Berkas?',
            text: 'Yakin dokumen ini sudah lengkap dan sesuai?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            confirmButtonText: 'Ya, ACC!',
            cancelButtonText: 'Cek Lagi'
        });
        if (!confirm.isConfirmed) return;
    }

    // TEMBAK KE BACKEND!
    try {
        Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const res = await fetch(`/api/dokumentasi/verifikasi/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: statusTujuan, catatan_admin: catatan })
        });

        const result = await res.json();

        if (result.success) {
            Swal.fire('Berhasil!', result.message, 'success');
            loadAntrean(); // Segarkan tabel otomatis
        } else {
            Swal.fire('Gagal!', result.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Sistem error, hubungi tim IT.', 'error');
    }
}
