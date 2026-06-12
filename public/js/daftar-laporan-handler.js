document.addEventListener('DOMContentLoaded', () => {
    loadTableData();
});

async function loadTableData() {
    try {
        const response = await fetch('/api/laporan');
        const json = await response.json();
        const tbody = document.getElementById('tbodyLaporan');

        if ($.fn.DataTable.isDataTable('#tableLaporan')) {
            $('#tableLaporan').DataTable().destroy();
        }

        tbody.innerHTML = '';

        if (json.success && json.data.length > 0) {
            json.data.forEach((item, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="text-center fw-bold">${idx + 1}</td>
                    <td>
                        <span class="badge bg-secondary mb-1">${item.no_surat_tugas}</span>
                        <br>
                        <small class="text-muted">Tanggal: ${formatTanggalID(item.tgl_surat_tugas)}</small>
                    </td>
                    <td>
                        <span class="fw-bold text-dark">${item.maksud_dinas}</span>
                    </td>
                    <td>
                        <small class="text-muted d-block"><i class="bi bi-clock-history"></i> Dibuat:</small>
                        <span>${formatTanggalID(item.created_at)}</span>
                    </td>
                    <td class="text-center">
                        <a href="/cetak_laporan_perjadin.html?id=${item.perjadin_id}" target="_blank" class="btn btn-sm btn-info shadow-sm me-1 text-white" title="Cetak Laporan">
                            <i class="bi bi-printer"></i>
                        </a>
                        <button onclick="hapusLaporan(${item.id})" class="btn btn-sm btn-danger shadow-sm" title="Hapus Laporan">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        $('#tableLaporan').DataTable({
            language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json' },
            ordering: false
        });

    } catch (err) {
        console.error('Gagal meload data laporan:', err);
        Swal.fire('Error', 'Gagal memuat data laporan dari server.', 'error');
    }
}

function hapusLaporan(id) {
    Swal.fire({
        title: 'Hapus Laporan?',
        text: "Anda dapat membuat laporannya kembali nanti. Lanjutkan?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/laporan/${id}`, { method: 'DELETE' });
                const json = await res.json();
                if (json.success) {
                    Swal.fire('Terhapus!', json.message, 'success');
                    loadTableData(); // Reload table
                } else {
                    Swal.fire('Gagal!', json.message, 'error');
                }
            } catch (err) {
                console.error('Error hapus laporan:', err);
                Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
            }
        }
    });
}

function formatTanggalID(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
