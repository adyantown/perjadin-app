// public/js/pegawai-handler.js

document.addEventListener('DOMContentLoaded', () => {
    loadDataPegawai(); // Load data pas halaman dibuka

    // Handle Submit Form (Bisa Simpan Baru / Update)
    const form = document.getElementById('formPegawai');
    form.addEventListener('submit', handleFormSubmit);
});

// 1. FUNGSI LOAD DATA KE TABEL
async function loadDataPegawai() {
    const tbody = document.getElementById('tabelPegawaiBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat...</td></tr>';

    try {
        const response = await fetch('/api/pegawai/data/all');
        const result = await response.json();

        if (result.success) {
            tbody.innerHTML = ''; // Bersihkan loading

            result.data.forEach((p, index) => {
                const tr = document.createElement('tr');

                // Badge warna-warni buat kategori
                let badgeClass = 'bg-secondary';
                if (p.kategori === 'PNS') badgeClass = 'bg-primary';
                if (p.kategori === 'PPPK') badgeClass = 'bg-warning text-dark';
                if (p.kategori === 'Komisioner') badgeClass = 'bg-danger';

                tr.innerHTML = `
                    <td class="text-center">${index + 1}</td>
                    <td>
                        <div class="fw-bold">${p.nama_pegawai}</div>
                        <small class="text-muted">${p.nip_nik || '-'}</small>
                    </td>
                    <td>${p.jabatan || '-'}</td>
                    <td>
                        <div>${p.pangkat || '-'} (${p.golongan || '-'})</div>
                        <span class="badge ${badgeClass} rounded-pill mt-1" style="font-size: 10px;">${p.kategori}</span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editPegawai(${p.id})" title="Edit">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="hapusPegawai(${p.id}, '${p.nama_pegawai}')" title="Hapus">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

// 2. FUNGSI BUKA MODAL TAMBAH
function bukaModalTambah() {
    document.getElementById('formPegawai').reset(); // Kosongkan form
    document.getElementById('pegawaiId').value = ''; // Kosongkan ID (tanda mode tambah)
    document.getElementById('modalTitle').innerText = 'Tambah Pegawai Baru';

    // Tampilkan Modal Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('modalPegawai'));
    modal.show();
}

// 3. FUNGSI EDIT (Tarik data lalu buka modal)
async function editPegawai(id) {
    try {
        const response = await fetch(`/api/pegawai/detail/${id}`);
        const result = await response.json();

        if (result.success) {
            const d = result.data;

            // Isi Form dengan data lama
            document.getElementById('pegawaiId').value = d.id;
            document.querySelector('[name="kategori"]').value = d.kategori;
            document.querySelector('[name="nama_pegawai"]').value = d.nama_pegawai;
            document.querySelector('[name="nip_nik"]').value = d.nip_nik;
            document.querySelector('[name="jabatan"]').value = d.jabatan;
            document.querySelector('[name="pangkat"]').value = d.pangkat;
            document.querySelector('[name="golongan"]').value = d.golongan;

            // Ubah Judul & Buka Modal
            document.getElementById('modalTitle').innerText = 'Edit Data Pegawai';
            const modal = new bootstrap.Modal(document.getElementById('modalPegawai'));
            modal.show();
        }
    } catch (error) {
        alert('Gagal mengambil data edit');
    }
}

// 4. FUNGSI SIMPAN / UPDATE
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const id = data.id; // Cek ada ID nya gak?

    // Tentukan URL & Method (Kalau ada ID berarti Update, kalau gak ada berarti Save)
    const url = id ? `/api/pegawai/update/${id}` : '/api/pegawai/save';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            // Tutup Modal
            const modalEl = document.getElementById('modalPegawai');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Refresh Tabel
            loadDataPegawai();
        } else {
            alert('Gagal: ' + result.message);
        }
    } catch (error) {
        alert('Terjadi kesalahan sistem');
    }
}

// 5. FUNGSI HAPUS
async function hapusPegawai(id, nama) {
    if (confirm(`Yakin ingin menghapus pegawai "${nama}"? Data yang sudah dihapus tidak bisa kembali.`)) {
        try {
            const response = await fetch(`/api/pegawai/delete/${id}`, { method: 'DELETE' });
            const result = await response.json();

            if (result.success) {
                loadDataPegawai(); // Refresh tabel
            } else {
                alert('Gagal menghapus: ' + result.message);
            }
        } catch (error) {
            alert('Error saat menghapus data');
        }
    }
}
