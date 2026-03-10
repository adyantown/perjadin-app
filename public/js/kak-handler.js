document.addEventListener('DOMContentLoaded', async () => {
    // 1. SET TANGGAL HARI INI SECARA OTOMATIS
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tgl_kak').value = today;

    // 2. ISI DASAR HUKUM OTOMATIS (Sesuai Standar KPU)
    const dasarHukumDefault = `a. Peraturan Menteri Keuangan Republik Indonesia Nomor 39 Tahun 2024 Tentang Standar Biaya Masukan TA 2025.
b. Peraturan Menteri Keuangan Republik Indonesia Nomor 113/PMK.05/2012 Tentang Perjalanan Dinas Jabatan Dalam Negeri Bagi Pejabat Negara, Pegawai Negeri, dan Pegawai Tidak Tetap.
c. Keputusan Komisi Pemilihan Umum Nomor 409 Tahun 2022 Tentang Pedoman Teknis Pelaksanaan Perjalanan Dinas Dalam Negeri di Lingkungan Komisi Pemilihan Umum.`;
    document.getElementById('dasar_hukum').value = dasarHukumDefault;

    // 3. TARIK DATA PPK DARI SETTING (Otomatis masuk ke form readonly)
    try {
        const resPejabat = await fetch('/api/settings');
        const jsonPejabat = await resPejabat.json();
        if (jsonPejabat.success && jsonPejabat.data) {
            document.getElementById('ppk_nama').value = jsonPejabat.data.ppk_nama || 'Fikriadi, S.IP'; // Fallback aman
            document.getElementById('ppk_nip').value = jsonPejabat.data.ppk_nip || '19800926 201012 1 001';
        }
    } catch (err) {
        console.error('Gagal meload PPK:', err);
    }

    // 4. TARIK 3 KAMAR DARI TABEL PAGU ANGGARAN
    try {
        const resPagu = await fetch('/api/pagu/all'); // Asumsi nanti kita bikin API ini
        const dataPagu = await resPagu.json();
        const selectPagu = document.getElementById('pagu_id');

        selectPagu.innerHTML = '<option value="">-- Pilih Pagu Beban Anggaran --</option>';
        dataPagu.forEach((pagu) => {
            // Tampilkan Nama Kamar dan Sisa Duitnya biar transparan!
            const sisaRupiah = parseInt(pagu.sisa_pagu).toLocaleString('id-ID');
            selectPagu.innerHTML += `<option value="${pagu.id}">${pagu.nama_kamar} (Sisa: Rp ${sisaRupiah})</option>`;
        });
    } catch (err) {
        console.error('Gagal meload Pagu:', err);
        document.getElementById('pagu_id').innerHTML = '<option value="">Gagal memuat data (Buat API-nya dulu ya Mas!)</option>';
    }
});
// ==========================================
// 5. HANDLE SUBMIT FORM KAK
// ==========================================
const formKak = document.getElementById('formKak');
if (formKak) {
    formKak.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah halaman refresh bawaan browser

        // Ambil semua data dari kotak-kotak form
        const formData = new FormData(formKak);
        const data = Object.fromEntries(formData.entries());

        try {
            // Lempar datanya ke API '/api/kak/save'
            const response = await fetch('/api/kak/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                alert('Berhasil! KAK telah tersimpan di sistem.');
                // Arahkan user ke halaman riwayat KAK setelah berhasil
                window.location.href = '/riwayat_kak.html';
            } else {
                alert('Gagal: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan sistem saat menyimpan KAK.');
        }
    });
}
