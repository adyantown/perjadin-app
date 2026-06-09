document.addEventListener('DOMContentLoaded', async () => {
    // Ambil ID dari URL (contoh: cetak_kak.html?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const idKak = urlParams.get('id');

    if (!idKak) {
        Swal.fire('Error!', 'ID KAK tidak ditemukan!', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/kak/view/${idKak}`);
        const result = await response.json();

        if (result.success && result.data) {
            const d = result.data;

            // Format Tanggal (Format: 18 November 2026)
            const dateObj = new Date(d.tgl_kak);
            const tglIndo = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            // Suntikkan data ke HTML
            document.getElementById('c_judul').innerText = d.judul_kegiatan;
            document.getElementById('c_pendahuluan').innerText = d.latar_belakang || '-';
            document.getElementById('c_hukum').innerText = d.dasar_hukum || '-';
            document.getElementById('c_tujuan').innerText = d.maksud_tujuan || '-';
            document.getElementById('c_output').innerText = d.output_kegiatan || '-';
            document.getElementById('c_pagu').innerText = d.nama_kamar || '-';

            document.getElementById('c_tgl').innerText = tglIndo;
            document.getElementById('c_nama_ppk').innerText = d.ppk_nama;
            document.getElementById('c_nip_ppk').innerText = d.ppk_nip;

            // MANTRA AUTO-PRINT (Tunggu 1 detik biar layout render sempurna)
            setTimeout(() => {
                window.print();
            }, 1000);

        } else {
            Swal.fire('Gagal!', 'Gagal mengambil data KAK.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
    }
});
