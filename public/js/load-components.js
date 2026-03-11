document.addEventListener('DOMContentLoaded', () => {
    const navbarContainer = document.getElementById('navbar-container');

    if (navbarContainer) {
        fetch('/components/navbar.html')
            .then((response) => response.text())
            .then((data) => {
                navbarContainer.innerHTML = data;

                const path = window.location.pathname;
                const titleElement = document.getElementById('current-menu-title');
                const extraButton = document.getElementById('navbar-extra-button');
                const subNav = document.getElementById('sub-navbar-container');
                const pageHeading = document.getElementById('page-heading');

                // Fungsi bantu untuk menampilkan Sub-Navbar secara natural
                const setupHeader = (menuLabel, pageTitle, link, btnColor) => {
                    titleElement.innerText = `» ${menuLabel}`;
                    if (pageHeading) pageHeading.innerText = pageTitle;

                    if (link) {
                        extraButton.innerHTML = `<a href="${link}" class="btn btn-sm ${btnColor} rounded-pill px-4 fw-bold shadow-sm">
                                                    <i class="bi bi-plus-lg me-1"></i> Tambah Data Baru
                                                 </a>`;
                    }
                    subNav.style.display = 'block';
                };

                if (path.includes('riwayat_kak.html')) {
                    setupHeader('Riwayat KAK', '', '/input_kak.html', 'btn-warning text-dark');
                } else if (path.includes('riwayat_rab.html')) {
                    setupHeader('Riwayat RAB', 'Daftar Rencana Anggaran', '/input_rab.html', 'btn-success');
                } else if (path.includes('riwayat_sppd.html')) {
                    setupHeader('Riwayat SPPD', 'Monitoring SPPD', '/input_sppd.html', 'btn-primary');
                } else if (path.includes('verifikasi_spj.html')) {
                    setupHeader('Verifikasi', 'Meja Verifikasi SPJ', null, null);
                }
            })
            .catch((error) => console.error('Gagal memuat Navbar:', error));
    }
});
