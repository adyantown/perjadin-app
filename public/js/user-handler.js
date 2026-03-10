document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    // Event Submit Form Tambah Akun
    document.getElementById('formUser').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/users/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();

            if (json.success) {
                Swal.fire('Berhasil!', json.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalUser')).hide();
                loadUsers(); // Refresh tabel
            } else {
                Swal.fire('Gagal!', json.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
        }
    });
});

// Ambil Data dari API
async function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    try {
        const res = await fetch('/api/users');
        const json = await res.json();
        tbody.innerHTML = '';

        if (json.success && json.data.length > 0) {
            json.data.forEach((u, index) => {
                const badgeRole = u.role === 'admin' ? 'bg-danger' : 'bg-primary';

                tbody.innerHTML += `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td class="fw-bold">${u.nama_lengkap || '-'}</td>
                        <td>${u.username}</td>
                        <td class="text-center"><span class="badge ${badgeRole}">${u.role.toUpperCase()}</span></td>
                        <td class="text-center">
                            <button onclick="resetPassword(${u.id}, '${u.username}')" class="btn btn-sm btn-outline-warning text-dark fw-bold me-1" title="Reset Password">
                                <i class="bi bi-key-fill"></i> Reset Pass
                            </button>
                            <button onclick="hapusUser(${u.id}, '${u.username}')" class="btn btn-sm btn-outline-danger fw-bold" title="Hapus Akun">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Belum ada data.</td></tr>';
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data.</td></tr>';
    }
}

// Buka Modal Tambah User
function bukaModalTambah() {
    document.getElementById('formUser').reset();
    new bootstrap.Modal(document.getElementById('modalUser')).show();
}

// Fitur Reset Password (Pakai Input SweetAlert2)
async function resetPassword(id, username) {
    const { value: passwordBaru } = await Swal.fire({
        title: `Reset Password untuk ${username}`,
        input: 'password',
        inputLabel: 'Masukkan Password Baru',
        inputPlaceholder: 'Minimal 6 karakter',
        inputAttributes: { minlength: 6, autocapitalize: 'off', autocorrect: 'off' },
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        confirmButtonText: '<i class="bi bi-save"></i> Simpan Password',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (!value || value.length < 6) return 'Password minimal 6 karakter!';
        },
    });

    if (passwordBaru) {
        try {
            const res = await fetch(`/api/users/reset-password/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passwordBaru }),
            });
            const json = await res.json();

            if (json.success) Swal.fire('Berhasil!', json.message, 'success');
            else Swal.fire('Gagal!', json.message, 'error');
        } catch (err) {
            Swal.fire('Error!', 'Gagal mereset password.', 'error');
        }
    }
}

// Fitur Hapus Akun
async function hapusUser(id, username) {
    const result = await Swal.fire({
        title: 'Hapus Akun?',
        text: `Anda yakin ingin menghapus akses login untuk "${username}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/users/delete/${id}`, { method: 'DELETE' });
            const json = await res.json();

            if (json.success) {
                Swal.fire('Terhapus!', json.message, 'success');
                loadUsers();
            } else {
                Swal.fire('Ditolak!', json.message, 'warning'); // Biasanya kalau nyoba hapus diri sendiri
            }
        } catch (err) {
            Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
        }
    }
}
