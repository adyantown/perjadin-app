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
                        <button onclick="editSppd(${item.id})" class="btn btn-sm btn-outline-primary me-1">
                            ✏️ Edit/Cetak
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
    if (confirm('Yakin ingin menghapus data SPPD ini?')) {
        try {
            const res = await fetch(`/api/sppd/delete/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                alert('Terhapus!');
                loadRiwayat(); // Reload tabel
            } else {
                alert('Gagal: ' + result.message);
            }
        } catch (err) {
            alert('Error koneksi');
        }
    }
}

function editSppd(id) {
    // Arahkan kembali ke form input dengan membawa ID
    window.location.href = `/input_sppd.html?edit=${id}`;
}
