// --- 1. FUNGSI HELPER & FORMATTING ---
function bersihAngka(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(/[^0-9.-]+/g, '')) || 0;
}

function formatRupiah(angka) {
    let number_string = angka.replace(/[^,\d]/g, '').toString(),
        split = number_string.split(','),
        sisa = split[0].length % 3,
        rupiah = split[0].substr(0, sisa),
        ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    return rupiah;
}

// --- 2. LOGIKA HITUNG OTOMATIS ---
function hitungOtomatis() {
    try {
        const rows = document.querySelectorAll('.pegawai-row');
        const jumlahPegawai = rows.length;

        const uangHarian = bersihAngka(document.querySelector('[name="uang_harian"]').value);
        const biayaTrans = bersihAngka(document.querySelector('[name="biaya_transportasi"]').value);
        const tarifHotel = bersihAngka(document.querySelector('[name="tarif_hotel"]').value);

        const tglB = document.querySelector('[name="tgl_berangkat"]').value;
        const tglP = document.querySelector('[name="tgl_pulang"]').value;
        const tglIn = document.querySelector('[name="tgl_checkin"]').value;
        const tglOut = document.querySelector('[name="tgl_checkout"]').value;

        let durasiPerjadin = 0;
        if (tglB && tglP) {
            const d1 = new Date(tglB);
            const d2 = new Date(tglP);
            if (d2 >= d1) durasiPerjadin = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        }

        let malamInap = 0;
        if (tglIn && tglOut) {
            const c1 = new Date(tglIn);
            const c2 = new Date(tglOut);
            if (c2 >= c1) malamInap = Math.ceil((c2 - c1) / (1000 * 60 * 60 * 24));
        }

        const totalHarian = uangHarian * durasiPerjadin * jumlahPegawai;
        const totalHotel = tarifHotel * malamInap;
        const grandTotal = totalHarian + biayaTrans + totalHotel;

        document.getElementById('preview-total').innerText = 'Rp ' + grandTotal.toLocaleString('id-ID');
    } catch (err) {
        console.error('Hitung error:', err);
    }
}
// Fungsi pembantu format tanggal

function formatTanggalIndo(tgl) {
    if (!tgl || tgl === '') return '-';

    // Teknik memecah string biar gak kena masalah Timezone
    const bagian = tgl.split('-'); // 2026-01-28 jadi ['2026', '01', '28']
    const tahun = bagian[0];
    const bulanAngka = bagian[1];
    const tanggal = bagian[2];

    const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    // Hapus angka 0 di depan tanggal (misal 01 jadi 1)
    const tglFix = parseInt(tanggal).toString();
    const blnFix = namaBulan[parseInt(bulanAngka)];

    // Output: 28 Januari 2026
    return `${tglFix} ${blnFix} ${tahun}`;
}
