// public/js/load-components.js
document.addEventListener('DOMContentLoaded', () => {
    // Cari elemen HTML yang punya id="navbar-container"
    const navbarContainer = document.getElementById('navbar-container');

    if (navbarContainer) {
        // Ambil isi file navbar.html dari server
        fetch('/components/navbar.html')
            .then((response) => response.text())
            .then((data) => {
                // Suntikkan kodingannya ke dalam halaman!
                navbarContainer.innerHTML = data;
            })
            .catch((error) => console.error('Gagal memuat Navbar:', error));
    }
});
