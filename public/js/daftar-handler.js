// Ambil Data dari API
fetch('/api/perjadin/all')
    .then((res) => res.json())
    .then((data) => {
        const body = document.getElementById('table-body');
        body.innerHTML = '';
        data.forEach((item) => {
            // 1. Tentukan pengali (jumlah pegawai)
            const jml = item.jumlah_sppd || 1;
            const pengali = jml > 1 ? `<br><small style="color: #d35400; font-weight:bold;">(x${jml} Org)</small>` : '';

            const row = `
        <tr>
            <td>${item.no_surat_tugas}<br><small>${formatTanggalIndo(item.tgl_surat_tugas)}</small></td>
            <td><b>${item.nama_pegawai || 'Tidak ada nama'}</b><br><small>${item.jabatan || ''}</small></td>
            <td>${item.tujuan}</td>
            <td>${item.maksud_dinas}</td>
            <td>${formatTanggalIndo(item.tgl_berangkat)} s/d ${formatTanggalIndo(item.tgl_pulang)}</td>
            
            <td>Rp ${(item.uang_harian || 0).toLocaleString('id-ID')}${pengali}</td>
            
            <td>Rp ${(item.biaya_transportasi || 0).toLocaleString('id-ID')}</td>
            
            <td>${item.nama_hotel || '-'}<br>Rp ${(item.tarif_hotel || 0).toLocaleString('id-ID')}${pengali}</td>
            
            <td class="total-row">Rp ${(item.total_biaya || 0).toLocaleString('id-ID')}</td>
            <td class="no-print">
                <div style="display: flex; gap: 5px;">
                    <a href="/index.html?edit=${item.id}" class="btn-edit" style="text-decoration:none; background:#f39c12; color:white; padding:6px 10px; border-radius:4px; font-size:11px; font-weight:bold;">
                        <span>✏️</span> Edit
                    </a>
                    <button onclick="hapusData(${item.id})" class="btn-delete">
                        <span>🗑️</span> Hapus
                    </button>
                </div>
            </td>
        </tr>
    `;
            body.innerHTML += row;
        });
    });

// Live Search
document.getElementById('searchInput').addEventListener('keyup', function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach((row) => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
});

// Fungsi Hapus Data (Sesuai app.js)
function hapusData(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        fetch(`/api/perjadin/delete/${id}`).then((res) => {
            if (res.ok) {
                alert('Data berhasil dihapus!');
                location.reload();
            } else {
                alert('Gagal menghapus data.');
            }
        });
    }
}

// Fungsi Export Excel
function exportToExcel() {
    const table = document.querySelector('table');
    const tableClone = table.cloneNode(true);

    // Bersihkan kolom aksi
    const noPrintElements = tableClone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    const tableHTML = tableClone.outerHTML.replace(/ /g, '%20');
    const filename = 'Laporan_Perjadin_KPU_Tubaba.xls';
    const downloadLink = document.createElement('a');

    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:application/vnd.ms-excel,' + tableHTML;
    downloadLink.download = filename;
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
