document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek apakah di URL ada tulisan "?alert=belum_login"
    const urlParams = new URLSearchParams(window.location.search);
    const alertType = urlParams.get('alert');

    if (alertType === 'belum_login') {
        // 2. Munculkan Alert Keras!
        Swal.fire({
            icon: 'warning',
            title: 'Mohon Maaf',
            text: 'Anda harus LOGIN dulu sebelum masuk ke sistem!',
            confirmButtonColor: '#800000'
        });

        // 3. (Opsional) Bersihkan URL biar rapi lagi
        window.history.replaceState({}, document.title, "/login.html");
    }

});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const btn = document.querySelector('button');

    // Efek loading
    btn.innerHTML = 'Memeriksa...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            // Login Berhasil!
            localStorage.setItem('user_kpu', JSON.stringify(data.user)); // Simpan info user

            Swal.fire({
                icon: 'success',
                title: 'Login Berhasil!',
                text: 'Selamat datang di E-PERJADIN',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = '/index.html'; // Pindah ke Dashboard
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: data.message,
                confirmButtonColor: '#800000'
            });
            btn.innerHTML = 'MASUK APLIKASI';
            btn.disabled = false;
        }
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Koneksi Bermasalah',
            text: 'Terjadi kesalahan saat terhubung ke server.',
            confirmButtonColor: '#800000'
        });
        btn.innerHTML = 'MASUK APLIKASI';
        btn.disabled = false;
    }
});
