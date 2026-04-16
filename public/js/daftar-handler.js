// public/js/daftar-handler.js

let allData = []; // Wadah data mentah

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Event Listener: Jalankan filter setiap kali user ngetik atau ganti bulan
    const searchInput = document.getElementById('searchInput');
    const filterBulan = document.getElementById('filterBulan');

    searchInput.addEventListener('keyup', applyFilter);
    filterBulan.addEventListener('change', applyFilter);
});

// 1. FUNGSI AMBIL DATA
function loadData() {
    fetch('/api/perjadin/all')
        .then((res) => res.json())
        .then((data) => {
            allData = data;
            renderTable(allData);
        })
        .catch((err) => {
            console.error(err);
            document.getElementById('table-body').innerHTML = '<tr><td colspan="10" class="text-center text-danger">Gagal memuat data API.</td></tr>';
        });
}

// 2. FUNGSI FILTER GABUNGAN
function applyFilter() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const bulanDipilih = document.getElementById('filterBulan').value;

    const filteredData = allData.filter((item) => {
        const str = (val) => (val || '').toString().toLowerCase();
        const matchKeyword = str(item.nama_pegawai).includes(keyword) || str(item.no_surat_tugas).includes(keyword) || str(item.tujuan).includes(keyword);

        let matchBulan = true;
        if (bulanDipilih) {
            const bulanData = (item.tgl_berangkat || '').substring(0, 7);
            matchBulan = bulanData === bulanDipilih;
        }

        return matchKeyword && matchBulan;
    });

    renderTable(filteredData);
}

// FUNGSI HELPER: Pengubah Pipa (|||) jadi Daftar Bernomor (Biar Rapi di Tabel & Excel)
function formatPipaAman(str) {
    if (!str) return '-';
    // Pecah berdasarkan pipa, bersihkan spasi, lalu buang yang kosong
    const arr = str
        .split('|||')
        .map((s) => s.trim())
        .filter(Boolean);

    // Kalau cuma 1 orang, tampilkan biasa
    if (arr.length <= 1) return arr[0] || '-';

    // Kalau lebih dari 1, buat daftar ke bawah pakai <br>
    return arr.map((val, idx) => `<span class="d-block mb-1"><b>${idx + 1}.</b> ${val}</span>`).join('');
}

// 3. FUNGSI RENDER TABEL (Sub-total Otomatis)
function renderTable(data) {
    const body = document.getElementById('table-body');
    body.innerHTML = '';

    if (data.length === 0) {
        body.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Data tidak ditemukan.</td></tr>';
        return;
    }

    let grandTotal = 0;

    data.forEach((item) => {
        grandTotal += parseInt(item.total_biaya) || 0;

        const jml = item.jumlah_sppd || 1;
        const pengali = jml > 1 ? `<div class="badge bg-warning text-dark mt-1" style="font-size: 0.75rem;">x${jml} Org</div>` : '';
        const rp = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');

        // ---> GUNAKAN HELPER PEMOTONG PIPA DI SINI <---
        const namaFormatted = formatPipaAman(item.nama_pegawai) || 'Tidak ada nama';
        const jabatanFormatted = formatPipaAman(item.jabatan);

        const row = `
            <tr>
                <td>
                    <span class="fw-bold text-dark">${item.no_surat_tugas}</span><br>
                    <small class="text-muted">${formatTanggalIndo(item.tgl_surat_tugas)}</small>
                </td>
                
                <td>
                    <div class="text-primary fw-bold">${namaFormatted}</div>
                    <hr class="my-1 border-secondary opacity-25">
                    <div class="text-muted small">${jabatanFormatted}</div>
                </td>
                
                <td>${item.tujuan}</td>
                <td><small>${item.maksud_dinas}</small></td>
                <td>
                    <span class="d-block" style="min-width: 120px;">
                        ${formatTanggalIndo(item.tgl_berangkat)} s/d<br>
                        ${formatTanggalIndo(item.tgl_pulang)}
                    </span>
                </td>
                
                <td class="text-end text-nowrap">
                    ${rp(item.uang_harian)}
                    ${pengali}
                </td>
                
                <td class="text-end text-nowrap">${rp(item.biaya_transportasi)}</td>
                
                <td class="text-end">
                    ${item.nama_hotel || '-'}
                    ${item.tarif_hotel ? '<br>' + rp(item.tarif_hotel) : ''}
                </td>
                
                <td class="text-end fw-bold bg-light text-nowrap" style="color: #bb2d3b;">
                    ${rp(item.total_biaya)}
                </td>

                <td class="no-print align-middle text-center">
                    <div class="d-flex justify-content-center gap-1">
                        <a href="/perjadin.html?edit=${item.id}" class="btn btn-warning btn-sm text-dark fw-bold" title="Edit Data" style="font-size: 0.8rem;">
                            <i class="bi bi-pencil-square"></i>
                        </a>
                        <button onclick="hapusData(${item.id})" class="btn btn-danger btn-sm fw-bold" title="Hapus Data" style="font-size: 0.8rem;">
                            <i class="bi bi-trash"></i>
                        </button>
                        <a href="/cetak_surat_tugas.html?id=${item.id}" target="_blank" class="btn btn-sm btn-primary" title="Cetak Surat Tugas">
                            <i class="bi bi-file-earmark-text"></i>
                        </a>
                        <a href="/cetak_sppd.html?id=${item.id}" target="_blank" class="btn btn-sm btn-secondary" title="Cetak SPPD">
                            <i class="bi bi-file-earmark-text"></i>
                        </a>
                        <a href="/cetak_kuitansi.html?id=${item.id}" target="_blank" class="btn btn-sm btn-success" title="Cetak Kuitansi">
                            <i class="bi bi-printer"></i>
                        </a>
                    </div>
                </td>
            </tr>
        `;
        body.innerHTML += row;
    });

    // Baris Sub-Total (Abu-abu & Print Friendly)
    const totalRow = `
        <tr style="background-color: #e2e6ea; border-top: 3px solid #333;">
            <td colspan="8" class="text-end text-uppercase pe-3 align-middle text-dark fw-bold">
                Total Pengeluaran (Data Ditampilkan):
            </td>
            <td class="text-end fw-bold text-dark fs-6 text-nowrap align-middle" style="background-color: #d1d5db;">
                Rp ${grandTotal.toLocaleString('id-ID')}
            </td>
            <td class="no-print bg-white border-0"></td> 
        </tr>
    `;
    body.innerHTML += totalRow;
}

// 4. FUNGSI RESET FILTER (Tombol X)
function resetFilter() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterBulan').value = '';
    applyFilter();
}

// 5. FUNGSI HAPUS DATA (UPGRADE SWEETALERT2)
function hapusData(id) {
    Swal.fire({
        title: 'Hapus Rekap Biaya?',
        text: 'Data yang dihapus tidak bisa dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#bb2d3b',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-trash"></i> Ya, Hapus!',
        cancelButtonText: 'Batal',
        reverseButtons: true,
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/perjadin/delete/${id}`, { method: 'DELETE' })
                .then((res) => res.json())
                .then((res) => {
                    if (res.success) {
                        Swal.fire({
                            title: 'Terhapus!',
                            text: 'Data berhasil dihilangkan.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false,
                        });
                        loadData(); // Langsung refresh tabel tanpa perlu F5
                    } else {
                        Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                    }
                })
                .catch(() => Swal.fire('Error!', 'Terjadi kesalahan koneksi server.', 'error'));
        }
    });
}

// 6. FUNGSI EXPORT EXCEL
function exportToExcel() {
    const table = document.querySelector('table');
    const tableClone = table.cloneNode(true);

    const noPrintElements = tableClone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    const tableHTML = tableClone.outerHTML.replace(/ /g, '%20');
    const filename = 'Laporan_Rekap_Biaya_KPU.xls';

    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:application/vnd.ms-excel,' + tableHTML;
    downloadLink.download = filename;
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
