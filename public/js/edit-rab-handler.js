document.addEventListener('DOMContentLoaded', async () => {
    const formatRp = (angka) => new Intl.NumberFormat('id-ID').format(angka);

    // Helper: format input rupiah dengan pemisah titik
    const formatRupiahInput = (str) => {
        const angka = str.replace(/[^\d]/g, '');
        return angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Helper: bersihkan string rupiah jadi angka
    const bersihRupiah = (str) => parseFloat(str.replace(/\./g, '')) || 0;

    // Live formatter untuk semua input rupiah
    document.querySelectorAll('.rupiah-input').forEach(input => {
        input.addEventListener('input', function () {
            const pos = this.selectionStart;
            const oldLen = this.value.length;
            this.value = formatRupiahInput(this.value);
            const newLen = this.value.length;
            this.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen));
        });
    });

    // Ambil ID dari URL (Contoh: edit_rab.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const rabId = urlParams.get('id');

    if (!rabId) {
        Swal.fire('Error!', 'ID RAB tidak ditemukan.', 'error').then(() => {
            window.location.href = '/riwayat_rab.html';
        });
        return;
    }

    // 1. TARIK DATA LAMA & ISI KE FORM (AUTO-FILL)
    try {
        const res = await fetch(`/api/rab/view/${rabId}`);
        const result = await res.json();

        if (result.success) {
            const d = result.data;

            // Isi Info KAK
            document.getElementById('info_judul').value = d.judul_kegiatan;
            document.getElementById('info_pagu').value = d.nama_kamar;

            // Isi Rincian Variabel
            document.getElementById('jml_orang').value = d.jml_orang;
            document.getElementById('jml_kegiatan').value = d.jml_kegiatan;
            document.getElementById('jml_hari').value = d.jml_hari;

            // Isi Rincian Uang Harian (format dengan titik)
            document.getElementById('uh_satuan').value = formatRupiahInput(Math.round(Number(d.uang_harian_satuan) || 0).toString());

            // Isi Rincian Transport
            document.getElementById('jenis_transport').value = d.jenis_transport;
            document.getElementById('tr_vol').value = d.transport_vol;
            document.getElementById('tr_satuan').value = formatRupiahInput(Math.round(Number(d.transport_satuan) || 0).toString());

            // Isi Rincian Penginapan
            document.getElementById('inn_vol').value = d.penginapan_vol || 0;
            document.getElementById('inn_satuan').value = formatRupiahInput(Math.round(Number(d.penginapan_satuan) || 0).toString());

            // Panggil fungsi hitung untuk pertama kali biar totalnya nampil
            hitungTotal();
        } else {
            Swal.fire('Gagal!', 'Data RAB tidak ditemukan', 'error');
        }
    } catch (err) {
        Swal.fire('Error!', 'Gagal menghubungi server.', 'error');
    }

    // 2. MESIN KALKULATOR LIVE
    const calcTriggers = document.querySelectorAll('.calc-trigger');
    calcTriggers.forEach((input) => {
        input.addEventListener('input', hitungTotal);
    });

    function hitungTotal() {
        const org = parseInt(document.getElementById('jml_orang').value) || 0;
        const keg = parseInt(document.getElementById('jml_kegiatan').value) || 0;
        const hari = parseInt(document.getElementById('jml_hari').value) || 0;
        const volHarian = org * keg * hari;

        const uhSatuan = bersihRupiah(document.getElementById('uh_satuan').value);
        const uhTotal = volHarian * uhSatuan;

        document.getElementById('rumus_uh').innerText = `Total: (${org} ORG x ${keg} KEG x ${hari} HR) x Rp ${formatRp(uhSatuan)}`;
        document.getElementById('uh_total_tampil').innerText = formatRp(uhTotal);
        document.getElementById('uh_total').value = uhTotal;

        const trVol = parseInt(document.getElementById('tr_vol').value) || 0;
        const trSatuan = bersihRupiah(document.getElementById('tr_satuan').value);
        const trTotal = trVol * trSatuan;

        document.getElementById('tr_total_tampil').innerText = formatRp(trTotal);
        document.getElementById('tr_total').value = trTotal;

        // Hitung Penginapan
        const innVol = parseInt(document.getElementById('inn_vol').value) || 0;
        const innSatuan = bersihRupiah(document.getElementById('inn_satuan').value);
        const innTotal = innVol * innSatuan;
        document.getElementById('rumus_inn').innerText = `Total: ${innVol} Malam x Rp ${formatRp(innSatuan)}`;
        document.getElementById('inn_total_tampil').innerText = formatRp(innTotal);
        document.getElementById('inn_total').value = innTotal;

        const grandTotal = uhTotal + trTotal + innTotal;
        document.getElementById('grand_total_tampil').innerText = 'Rp ' + formatRp(grandTotal);
        document.getElementById('grand_total').value = grandTotal;
    }

    // 3. SUBMIT REVISI KE BACKEND
    document.getElementById('formEditRab').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(document.getElementById('formEditRab'));
        const data = Object.fromEntries(formData.entries());

        // Bersihkan field satuan dari format titik ribuan (contoh: "250.000" → "250000")
        ['uang_harian_satuan', 'transport_satuan', 'penginapan_satuan'].forEach(key => {
            if (data[key]) data[key] = data[key].replace(/\./g, '');
        });

        try {
            const response = await fetch(`/api/rab/update/${rabId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    title: 'Revisi Berhasil!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#198754',
                }).then(() => {
                    window.location.href = '/riwayat_rab.html';
                });
            } else {
                // Ini bakal muncul kalau selisih biaya baru lebih gede dari sisa pagu
                Swal.fire('Ditolak!', result.message, 'warning');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error sistem!', 'Terjadi kesalahan saat menyimpan revisi.', 'error');
        }
    });
});
