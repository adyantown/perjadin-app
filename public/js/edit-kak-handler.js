document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ambil ID KAK dari URL (misal: /edit_kak.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const kakId = urlParams.get('id');

    if (!kakId) {
        Swal.fire('Error', 'ID KAK tidak ditemukan!', 'error').then(() => window.location.href = '/riwayat_kak.html');
        return;
    }

    document.getElementById('kak_id').value = kakId;

    // 2. Tarik Data Pagu Anggaran untuk Dropdown
    try {
        const resPagu = await fetch('/api/pagu/all');
        const jsonPagu = await resPagu.json();
        const selectPagu = document.getElementById('pagu_id');

        selectPagu.innerHTML = '<option value="">-- Pilih Pagu Beban Anggaran --</option>';
        if (jsonPagu.success && jsonPagu.data) {
            jsonPagu.data.forEach((pagu) => {
                // Pakai parseInt biar nggak jadi ratusan juta
                const sisaRupiah = parseInt(pagu.sisa_pagu).toLocaleString('id-ID');
                selectPagu.innerHTML += `<option value="${pagu.id}">${pagu.nama_kamar} (Sisa: Rp ${sisaRupiah})</option>`;
            });
        }
    } catch (err) {
        console.error('Gagal meload Pagu:', err);
    }

    // 3. Tarik Data KAK Lama dari Database
    try {
        const resKak = await fetch(`/api/kak/view/${kakId}`);
        const jsonKak = await resKak.json();

        if (jsonKak.success && jsonKak.data) {
            const k = jsonKak.data;
            document.getElementById('judul_kegiatan').value = k.judul_kegiatan;

            // Format tanggal biar bisa masuk ke input type="date"
            const tgl = new Date(k.tgl_kak).toISOString().split('T')[0];
            document.getElementById('tgl_kak').value = tgl;

            document.getElementById('pagu_id').value = k.pagu_id;
            document.getElementById('latar_belakang').value = k.latar_belakang;
            document.getElementById('maksud_tujuan').value = k.maksud_tujuan;
            document.getElementById('output_kegiatan').value = k.output_kegiatan;
            document.getElementById('dasar_hukum').value = k.dasar_hukum;
            document.getElementById('ppk_nama').value = k.ppk_nama;
            document.getElementById('ppk_nip').value = k.ppk_nip;
        } else {
            Swal.fire('Error', 'Data KAK tidak ditemukan', 'error');
        }
    } catch (err) {
        console.error('Gagal meload KAK lama:', err);
        Swal.fire('Error', 'Gagal menghubungi server', 'error');
    }
});

// 4. Proses Submit Edit
document.getElementById('formEditKak').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const kakId = document.getElementById('kak_id').value;

    try {
        Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

        const response = await fetch(`/api/kak/update/${kakId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Data KAK telah diubah.',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.href = '/riwayat_kak.html';
            });
        } else {
            Swal.fire('Gagal!', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'Terjadi kesalahan sistem saat menyimpan KAK.', 'error');
    }
});
