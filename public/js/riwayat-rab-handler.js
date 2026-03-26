document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('tabelBodyRab');

    // Fungsi Format Rupiah
    const formatRp = (angka) => new Intl.NumberFormat('id-ID').format(angka);

    try {
        const response = await fetch('/api/rab/all');
        const data = await response.json();

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada dokumen RAB yang dibuat.</td></tr>`;
            return;
        }

        tbody.innerHTML = ''; // Kosongkan loading
        data.forEach((item, index) => {
            const tgl = new Date(item.tgl_rab).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

            const row = `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td><span class="badge bg-light text-dark border"><i class="bi bi-calendar-event me-1"></i> ${tgl}</span></td>
                    <td class="fw-bold text-secondary">${item.judul_kegiatan}</td>
                    <td><small class="text-muted"><i class="bi bi-tags me-1"></i> ${item.nama_kamar}</small></td>
                    <td class="text-end fw-bold text-dark">Rp ${formatRp(item.total_rab)}</td>
                    <td class="text-center">
                        <div class="d-grid gap-1">
                            <a href="/cetak_rab.html?id=${item.id}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill shadow-sm">
                                <i class="bi bi-printer-fill me-1"></i> Cetak
                            </a>
                            <a href="/edit_rab.html?id=${item.id}" class="btn btn-sm btn-outline-warning text-dark rounded-pill shadow-sm">
                                <i class="bi bi-pencil-square me-1"></i> Edit
                            </a>
                            <button onclick="hapusRab(${item.id})" class="btn btn-sm btn-outline-danger rounded-pill shadow-sm">
                                <i class="bi bi-trash-fill me-1"></i> Hapus
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error load RAB:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Gagal memuat data dari server.</td></tr>`;
    }
});

window.hapusRab = (id) => {
    // Munculkan pop-up konfirmasi yang cakep
    Swal.fire({
        title: 'Yakin ingin membatalkan?',
        text: "Saldo RAB ini akan otomatis dikembalikan ke Pagu lho!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545', // Warna merah danger
        cancelButtonColor: '#6c757d', // Warna abu-abu sekunder
        confirmButtonText: '<i class="bi bi-trash-fill me-1"></i> Ya, Hapus & Refund!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        // Kalau user klik tombol "Ya, Hapus"
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/rab/delete/${id}`, {
                    method: 'DELETE'
                });
                const resJson = await response.json();

                if (resJson.success) {
                    // Pop-up sukses!
                    Swal.fire({
                        title: 'Berhasil!',
                        text: resJson.message,
                        icon: 'success',
                        confirmButtonColor: '#198754'
                    }).then(() => {
                        window.location.reload(); // Refresh halaman setelah diklik OK
                    });
                } else {
                    Swal.fire('Gagal!', resJson.message, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error sistem!', 'Terjadi kesalahan saat menghapus data.', 'error');
            }
        }
    });
};
