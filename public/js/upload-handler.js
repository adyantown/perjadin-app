document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ambil data SPPD dan SPJ secara bersamaan
    try {
        const resSppd = await fetch('/api/sppd/all');
        const jsonSppd = await resSppd.json();

        const resSpj = await fetch('/api/dokumentasi/semua');
        const jsonSpj = await resSpj.json();

        // 2. Kumpulkan ID SPPD yang status SPJ-nya sudah "ACC"
        const accSppdIds = [];
        if (jsonSpj.success) {
            jsonSpj.data.forEach(spj => {
                if (spj.status === 'ACC') {
                    accSppdIds.push(spj.sppd_id); // Masukkan ke daftar hitam (disembunyikan)
                }
            });
        }

        // 3. Render Dropdown Surat Tugas (Grouping)
        const select = document.getElementById('nomor_st');
        select.innerHTML = '<option value="">-- Pilih Surat Tugas Rombongan --</option>';

        if (jsonSppd.success) {
            const groupedSppd = {};
            
            jsonSppd.data.forEach(item => {
                // TAMPILKAN HANYA JIKA SPPD INI BELUM DI-ACC
                if (!accSppdIds.includes(item.id)) {
                    if (!groupedSppd[item.nomor_st]) {
                        groupedSppd[item.nomor_st] = {
                            nomor_st: item.nomor_st,
                            maksud_dinas: item.maksud_dinas,
                            tgl_berangkat: item.tgl_berangkat ? item.tgl_berangkat.split('T')[0] : '-',
                            pegawai_list: []
                        };
                    }
                    // Ambil nama sebelum slash atau gelar agar tidak terlalu panjang
                    const namaPendek = item.nama_pegawai ? item.nama_pegawai.split(' /')[0] : 'Tanpa Nama';
                    groupedSppd[item.nomor_st].pegawai_list.push(namaPendek);
                }
            });

            // Render ke dropdown
            Object.values(groupedSppd).forEach(group => {
                const namaNama = group.pegawai_list.join(', ');
                select.innerHTML += `<option value="${group.nomor_st}">[${group.tgl_berangkat}] ${group.maksud_dinas} (${group.pegawai_list.length} Orang: ${namaNama})</option>`;
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
        if (json.data.length === 0) return tbody.innerHTML = '<tr><td class="text-center text-muted py-3">Belum ada SPJ yang diupload.</td></tr>';

        tbody.innerHTML = '';
        json.data.forEach(item => {
            let badge = 'bg-warning text-dark';
            if (item.status === 'ACC') badge = 'bg-success';
            if (item.status === 'Revisi') badge = 'bg-danger';

            let catatan = item.status === 'Revisi' && item.catatan_admin ? `<div class="alert alert-danger p-2 mt-2 mb-0 small"><i class="bi bi-info-circle-fill"></i> <b>Catatan Admin:</b> ${item.catatan_admin}</div>` : '';

            tbody.innerHTML += `
                <tr>
                    <td class="px-4 py-3">
                        <div class="fw-bold text-dark">${item.maksud_dinas}</div>
                        <div class="text-muted small"><i class="bi bi-person"></i> ${item.nama_pegawai} | <i class="bi bi-file-earmark-pdf"></i> <a href="${item.file_pdf}" target="_blank">Lihat Berkas</a></div>
                        ${catatan}
                    </td>
                    <td class="text-end px-4"><span class="badge ${badge} rounded-pill px-3 py-2">${item.status}</span></td>
                </tr>
            `;
        });
    } catch (err) { console.error(err); }
}
