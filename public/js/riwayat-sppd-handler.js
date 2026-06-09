document.addEventListener('DOMContentLoaded', () => {
    loadRiwayat();

    // Fitur Pencarian Cepat
    document.getElementById('searchInput').addEventListener('keyup', function () {
        const value = this.value.toLowerCase();
        const rows = document.querySelectorAll('#tabelRiwayat tr');
        rows.forEach((row) => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(value) ? '' : 'none';
        });
    });
});

async function loadRiwayat() {
    try {
        const response = await fetch('/api/sppd/all');
        const result = await response.json();

        const tbody = document.getElementById('tabelRiwayat');
        tbody.innerHTML = '';

        if (result.success && result.data.length > 0) {
            result.data.forEach((item) => {
                // Gunakan helper formatTanggalIndo dari utils.js
                const tglSurat = formatTanggalIndo(item.tgl_surat);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <span class="fw-bold text-danger">${item.nomor_st || '-'}</span>
                    </td>
                    <td>${tglSurat}</td>
                    <td>
                        <div class="fw-bold">${item.nama_pegawai || '-'}</div>
                        <small class="text-muted">${item.nip_pegawai || ''}</small>
                    </td>
                    <td>${item.tempat_tujuan || '-'}</td>
                    <td>
                        <a href="/input_sppd.html?edit=${item.id}&action=print" target="_blank" class="btn btn-sm btn-outline-success me-1">
                            🖨️ Cetak
                        </a>
                        
                        <button onclick="editSppd(${item.id})" class="btn btn-sm btn-outline-primary me-1">
                            ✏️ Edit
                        </button>
                        
                        <button onclick="hapusSppd(${item.id})" class="btn btn-sm btn-outline-danger">
                            🗑️ Hapus
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Belum ada data SPPD.</td></tr>';
        }
    } catch (error) {
        console.error('Gagal load data:', error);
    }
}

async function hapusSppd(id) {
    const result = await Swal.fire({
        title: 'Hapus Data SPPD?',
        text: 'Data yang dihapus tidak bisa dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#bb2d3b',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
        reverseButtons: true
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/sppd/delete/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ title: 'Terhapus!', text: 'Data SPPD berhasil dihapus.', icon: 'success', timer: 1500, showConfirmButton: false });
                loadRiwayat();
            } else {
                Swal.fire('Gagal!', data.message, 'error');
            }
        } catch (err) {
            Swal.fire('Error!', 'Terjadi kesalahan koneksi.', 'error');
        }
    }
}

function editSppd(id) {
    // Arahkan kembali ke form input dengan membawa ID
    window.location.href = `/input_sppd.html?edit=${id}`;
}
