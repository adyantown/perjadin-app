document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('tabelBodyKak');

    try {
        const response = await fetch('/api/kak/all');
        const data = await response.json();

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Belum ada KAK yang dibuat.</td></tr>`;
            return;
        }

        tbody.innerHTML = ''; // Kosongkan loading
        data.forEach((item, index) => {
            const tgl = new Date(item.tgl_kak).toLocaleDateString('id-ID');

            let actionButtons = `
                <a href="/cetak_kak.html?id=${item.id}" target="_blank" class="btn btn-sm btn-outline-success rounded-pill shadow-sm mb-1">
                    <i class="bi bi-printer-fill me-1"></i> Cetak
                </a>
            `;

            if (item.has_rab == 0) {
                actionButtons += `
                    <a href="/edit_kak.html?id=${item.id}" class="btn btn-sm btn-outline-warning text-dark rounded-pill shadow-sm mb-1">
                        <i class="bi bi-pencil-square me-1"></i> Edit
                    </a>
                    <button onclick="hapusKak(${item.id})" class="btn btn-sm btn-outline-danger rounded-pill shadow-sm mb-1">
                        <i class="bi bi-trash-fill me-1"></i> Hapus
                    </button>
                `;
            } else {
                actionButtons += `
                    <span class="badge bg-secondary rounded-pill mt-1" style="font-size:0.75rem;">
                        <i class="bi bi-lock-fill"></i> Terkunci (RAB Aktif)
                    </span>
                `;
            }

            const row = `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td><span class="badge bg-light text-dark border"><i class="bi bi-calendar-event me-1"></i> ${tgl}</span></td>
                    <td class="fw-bold text-secondary">${item.judul_kegiatan}</td>
                    <td><small class="text-muted"><i class="bi bi-tags me-1"></i> ${item.nama_kamar || 'Kamar Tidak Diketahui'}</small></td>
                    <td class="text-center">
                        <div class="d-grid gap-1">
                            ${actionButtons}
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error load KAK:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Gagal memuat data dari server.</td></tr>`;
    }
});

// FUNGSI HAPUS TARUH DI LUAR DOMContentLoaded JUGA AMAN
window.hapusKak = (id) => {
    Swal.fire({
        title: 'Yakin ingin menghapus KAK?',
        text: "Data yang dihapus tidak dapat dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-trash-fill"></i> Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/kak/delete/${id}`, { method: 'DELETE' });
                const resJson = await res.json();
                if (resJson.success) {
                    Swal.fire('Berhasil!', resJson.message, 'success').then(() => window.location.reload());
                } else {
                    Swal.fire('Gagal!', resJson.message, 'error');
                }
            } catch (err) {
                Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
            }
        }
    });
};
