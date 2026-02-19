document.addEventListener('DOMContentLoaded', () => {
    // 1. CEK USER LOGIN (Fitur Baru)
    fetch('/api/auth/check')
        .then((res) => res.json())
        .then((data) => {
            document.getElementById('welcomeMsg').innerHTML = `Selamat Datang, ${data.user}! 👋`;

            // LOGIKA TAMPILAN MENU BERDASARKAN ROLE
            const role = data.role; // 'admin' atau 'user'

            if (role === 'admin') {
                // Admin: Lihat Galeri, Sembunyikan Upload (Opsional, atau munculin dua-duanya)
                document.getElementById('cardGaleriAdmin').style.display = 'block';
                // document.getElementById('cardUploadLaporan').style.display = 'none'; // Kalau admin gak perlu lapor
            } else {
                // User Biasa: Sembunyikan Galeri & Menu Admin Lainnya
                document.getElementById('cardGaleriAdmin').style.display = 'none';

                // Sembunyikan menu sensitif lainnya (Fitur yg sebelumnya kita buat)
                const menuSetting = document.getElementById('menuSetting');
                const menuPegawai = document.getElementById('menuPegawai');
                if (menuSetting) menuSetting.parentElement.style.display = 'none';
                if (menuPegawai) menuPegawai.parentElement.style.display = 'none';
            }
        })
        .catch((err) => console.error('Gagal cek session:', err));

    // 2. LOAD STATISTIK (Fitur Lama Tetap Jalan)
    fetch('/api/dashboard/stats')
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                // Efek animasi angka naik
                animateValue('stat_sppd', 0, result.data.total_sppd, 1000);
                animateValue('stat_pegawai', 0, result.data.total_pegawai, 1000);
            }
        })
        .catch((err) => console.error('Gagal load statistik:', err));
});

// Fungsi Animasi Angka
function animateValue(id, start, end, duration) {
    if (start === end) return;
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const obj = document.getElementById(id);
    const timer = setInterval(function () {
        current += increment;
        obj.innerHTML = current;
        if (current == end) {
            clearInterval(timer);
        }
    }, stepTime);
}
