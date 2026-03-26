// Langsung muat data saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => loadDataPagu());

async function loadDataPagu() {
    try {
        const res = await fetch('/api/pagu/all');
        const json = await res.json();
        const tbody = document.getElementById('pagu-tbody');
        tbody.innerHTML = '';

        if (json.success && json.data.length > 0) {
            json.data.forEach(item => {
                const paguBulat = parseInt(item.pagu_awal);
                const sisaBulat = parseInt(item.sisa_pagu);

                tbody.innerHTML += `
                        <tr>
                            <td class="py-3">
                                <span class="badge bg-secondary mb-1">${item.kegiatan_kode || '-'}</span><br>
                                <span class="fw-bold text-dark">${item.nama_kamar}</span>
                            </td>
                            <td class="text-end fw-bold text-secondary">Rp ${paguBulat.toLocaleString('id-ID')}</td>
                            <td class="text-end fw-bold text-success fs-6">Rp ${sisaBulat.toLocaleString('id-ID')}</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-warning rounded-pill px-3 shadow-sm fw-bold text-dark" 
                                    onclick="modalRevisi(${item.id}, '${item.nama_kamar}', ${paguBulat})">
                                    <i class="bi bi-pencil-square me-1"></i> Revisi
                                </button>
                            </td>
                        </tr>
                    `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">Belum ada data pagu.</td></tr>`;
        }
    } catch (err) {
        console.error("Gagal meload pagu", err);
        document.getElementById('pagu-tbody').innerHTML = `<tr><td colspan="4" class="text-center py-3 text-danger">Gagal mengambil data dari server.</td></tr>`;
    }
}

// Pop-Up Cantik untuk Input Revisi
function modalRevisi(id, namaKamar, paguSaatIni) {
    Swal.fire({
        title: 'Revisi Pagu DIPA',
        html: `
                <div class="text-start mb-3 p-3 bg-light rounded border">
                    <small class="text-muted fw-bold d-block mb-1">Kamar Anggaran:</small>
                    <span class="fw-bold text-primary">${namaKamar}</span>
                </div>
                <div class="text-start">
                    <label class="form-label fw-bold">Nominal Pagu DIPA Baru:</label>
                    <input type="number" id="inputPaguBaru" class="form-control form-control-lg text-end fw-bold" value="${paguSaatIni}">
                    <small class="text-muted mt-2 d-block"><i class="bi bi-magic text-warning me-1"></i> Sisa anggaran rill saat ini akan disesuaikan secara otomatis oleh sistem.</small>
                </div>
            `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Simpan Revisi',
        cancelButtonText: 'Batal',
        preConfirm: () => {
            const val = document.getElementById('inputPaguBaru').value;
            if (!val || val === '') {
                Swal.showValidationMessage('Nominal Pagu tidak boleh kosong!');
                return false;
            }
            return val;
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const paguBaru = result.value;
            try {
                // Tampilkan loading spinner SweetAlert
                Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

                const response = await fetch(`/api/pagu/revisi/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pagu_baru: paguBaru })
                });
                const resJson = await response.json();

                if (resJson.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: resJson.message,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    loadDataPagu(); // Refresh tabel setelah sukses
                } else {
                    Swal.fire('Gagal!', resJson.message, 'error');
                }
            } catch (e) {
                Swal.fire('Error!', 'Terjadi kesalahan jaringan/server.', 'error');
            }
        }
    });
}
