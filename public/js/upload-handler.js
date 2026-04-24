// HELPER: Format nama pegawai dari separator ||| menjadi daftar bernomor
function formatNamaPegawai(str) {
    if (!str) return '-';
    const arr = str.split('|||').map(s => s.trim()).filter(Boolean);
    if (arr.length <= 1) return arr[0] || '-';
    return arr.map((nama, i) => `<span class="d-block mb-1"><b>${i + 1}.</b> ${nama}</span>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ambil data Perjadin dan SPJ secara bersamaan
    try {
        const resPerjadin = await fetch('/api/perjadin/all');
        const dataPerjadin = await resPerjadin.json();

        const resSpj = await fetch('/api/dokumentasi/semua');
        const jsonSpj = await resSpj.json();

        // 2. Kumpulkan Nomor ST yang status SPJ-nya sudah "ACC"
        const accSTs = [];
        if (jsonSpj.success) {
            jsonSpj.data.forEach(spj => {
                if (spj.status === 'ACC' && spj.nomor_st) {
                    accSTs.push(spj.nomor_st); // Masukkan ke daftar hitam (disembunyikan)
                }
            });
        }

        // 3. Render Dropdown Surat Tugas dari Perjadin
        const select = document.getElementById('nomor_st');
        select.innerHTML = '<option value="">-- Pilih Surat Tugas Rombongan --</option>';

        if (Array.isArray(dataPerjadin)) {
            dataPerjadin.forEach(item => {
                // TAMPILKAN HANYA JIKA ST INI BELUM DI-ACC
                if (!accSTs.includes(item.no_surat_tugas)) {
                    let namaArray = [];
                    if (item.nama_pegawai) {
                        if (item.nama_pegawai.includes('|||')) {
                            namaArray = item.nama_pegawai.split('|||').map(n => n.trim()).filter(n => n !== '');
                        } else {
                            namaArray = [item.nama_pegawai.trim()];
                        }
                    }

                    // Ambil nama sebelum slash atau koma agar tidak terlalu panjang
                    const shortNames = namaArray.map(n => n.split(/[\/,]/)[0].trim());
                    const namaNama = shortNames.join(', ');
                    
                    const tglBerangkat = item.tgl_berangkat ? item.tgl_berangkat.split('T')[0] : '-';

                    select.innerHTML += `<option value="${item.no_surat_tugas}">[${tglBerangkat}] ${item.maksud_dinas} (${namaArray.length} Orang: ${namaNama})</option>`;
                }
            });
        }
    } catch (err) {
        console.error('Gagal memuat dropdown:', err);
    }

    // 4. Load Status SPJ ke tabel bawah
    loadStatusSpj();
});

// Validasi Ukuran File (Maks 10MB)
document.getElementById('file_pdf').addEventListener('change', function () {
    const btn = document.getElementById('btnSubmit');
    const errorTxt = document.getElementById('errorSize');
    if (this.files.size > 10 * 1024 * 1024) {
        btn.disabled = true; errorTxt.style.display = 'block';
    } else {
        btn.disabled = false; errorTxt.style.display = 'none';
    }
});

// 3. Handle Submit
document.getElementById('formUploadSpj').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    Swal.fire({ title: 'Mengupload...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const res = await fetch('/api/dokumentasi/upload', { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            Swal.fire('Berhasil!', result.message, 'success');
            e.target.reset();
            loadStatusSpj(); // Refresh tabel
        } else { Swal.fire('Gagal!', result.message, 'error'); }
    } catch (err) { Swal.fire('Error', 'Gagal menghubungi server.', 'error'); }
});

async function loadStatusSpj() {
    try {
        const res = await fetch('/api/dokumentasi/semua');
        const json = await res.json();
        const tbody = document.getElementById('tabelStatusUser');
        if (json.data.length === 0) return tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">Belum ada SPJ yang diupload.</td></tr>';

        tbody.innerHTML = '';
        json.data.forEach(item => {
            let badge = 'bg-warning text-dark';
            if (item.status === 'ACC') badge = 'bg-success';
            if (item.status === 'Revisi') badge = 'bg-danger';

            let catatan = item.status === 'Revisi' && item.catatan_admin ? `<div class="alert alert-danger p-2 mt-2 mb-0 small"><i class="bi bi-info-circle-fill"></i> <b>Catatan Admin:</b> ${item.catatan_admin}</div>` : '';

            // Tombol hapus hanya muncul jika belum ACC
            let aksiHapus = '';
            if (item.status !== 'ACC') {
                aksiHapus = `<button onclick="hapusSpj(${item.id})" class="btn btn-sm btn-merah-terang rounded-pill px-3" title="Hapus SPJ"><i class="bi bi-trash me-1"></i>Hapus</button>`;
            } else {
                aksiHapus = `<span class="text-success small fw-bold"><i class="bi bi-check-circle-fill me-1"></i>Selesai</span>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td class="px-4 py-3">
                        <div class="fw-bold text-dark">${formatNamaPegawai(item.nama_pegawai)}</div>
                        <div class="text-muted small"><i class="bi bi-briefcase"></i> ${item.maksud_dinas} | <i class="bi bi-file-earmark-pdf"></i> <a href="${item.file_pdf}" target="_blank">Lihat Berkas</a></div>
                        ${catatan}
                    </td>
                    <td class="text-center"><span class="badge ${badge} rounded-pill px-3 py-2">${item.status}</span></td>
                    <td class="text-center">${aksiHapus}</td>
                </tr>
            `;
        });
    } catch (err) { console.error(err); }
}

// FUNGSI HAPUS SPJ (Hanya untuk status selain ACC)
async function hapusSpj(id) {
    const confirm = await Swal.fire({
        title: 'Hapus Berkas SPJ?',
        text: 'File yang sudah dihapus tidak bisa dikembalikan. Anda bisa upload ulang nanti.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-trash me-1"></i> Ya, Hapus!',
        cancelButtonText: 'Batal',
        reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    try {
        const res = await fetch(`/api/dokumentasi/delete/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            Swal.fire({ title: 'Terhapus!', text: 'Berkas SPJ berhasil dihapus.', icon: 'success', timer: 1500, showConfirmButton: false });
            loadStatusSpj(); // Refresh tabel
        } else {
            Swal.fire('Gagal!', result.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Gagal menghubungi server.', 'error');
    }
}
