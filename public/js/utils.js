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

function formatRp(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

// --- 2. LOGIKA HITUNG OTOMATIS ---
function hitungOtomatis() {
    try {
        const rows = document.querySelectorAll('.pegawai-row');
        const jumlahPegawai = rows.length;

        const uangHarian = bersihAngka(document.querySelector('[name="uang_harian"]').value);
        const biayaBbm = bersihAngka(document.querySelector('[name="biaya_bbm"]')?.value || '0');
        const biayaTol = bersihAngka(document.querySelector('[name="biaya_tol"]')?.value || '0');
        const biayaTiket = bersihAngka(document.querySelector('[name="biaya_tiket"]')?.value || '0');
        const biayaParkir = bersihAngka(document.querySelector('[name="biaya_parkir"]')?.value || '0');
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

        const checkedHotels = document.querySelectorAll('.check-hotel:checked');
        const hotelMultiplier = checkedHotels.length || 0;
        
        const totalHarian = uangHarian * durasiPerjadin * jumlahPegawai;
        const totalTransport = biayaBbm + biayaTol + biayaTiket + biayaParkir;
        const totalHotel = tarifHotel * malamInap * hotelMultiplier;
        const grandTotal = totalHarian + totalTransport + totalHotel;

        document.getElementById('preview-total').innerText = 'Rp ' + grandTotal.toLocaleString('id-ID');
    } catch (err) {
        console.error('Hitung error:', err);
    }
}
// Fungsi pembantu format tanggal

// Fungsi pembantu format tanggal (Versi Bulletproof)
function formatTanggalIndo(tgl) {
    if (!tgl || tgl === '') return '-';

    try {
        // Objek Date akan otomatis mengenali format (ISO, YYYY-MM-DD, dll)
        // dan menyesuaikannya dengan zona waktu lokal komputer (WIB)
        const dateObj = new Date(tgl);

        // Jaring pengaman: Kalau datanya bukan tanggal yang valid, kembalikan teks aslinya
        if (isNaN(dateObj.getTime())) return tgl;

        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        // Ambil elemen satu per satu
        const tanggal = dateObj.getDate();
        const bulan = namaBulan[dateObj.getMonth()];
        const tahun = dateObj.getFullYear();

        // DIJAMIN urutannya: Tanggal (Spasi) Bulan (Spasi) Tahun
        return `${tanggal} ${bulan} ${tahun}`;
    } catch (error) {
        console.error('Error memformat tanggal:', error);
        return tgl; // Fallback kalau terjadi error
    }
}

// --- 3. SESSION / AUTH HELPER ---
async function getUserSession() {
    try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) throw new Error('Not authenticated');
        return await res.json();
    } catch (err) {
        console.error('Session check failed', err);
        return { loggedIn: false, role: 'user' };
    }
}
