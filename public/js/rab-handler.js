document.addEventListener('DOMContentLoaded', async () => {
    // Set Tanggal Hari Ini
    document.getElementById('tgl_rab').value = new Date().toISOString().split('T')[0];

    // Elemen-elemen penting
    const selectKak = document.getElementById('kak_id');
    const panelBrankas = document.getElementById('panelBrankas');
    const btnSimpan = document.getElementById('btnSimpan');
    const pesanValidasi = document.getElementById('pesanValidasi');

    let currentSisaPagu = 0; // Menyimpan memori sisa uang

    // 1. FUNGSI FORMAT RUPIAH
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

    // 2. AMBIL DATA KAK DARI DATABASE (Nanti kita bikin API-nya)
    try {
        const res = await fetch('/api/rab/kandidat-kak');
        const data = await res.json();
        selectKak.innerHTML = '<option value="">-- Pilih Dokumen KAK --</option>';
        data.forEach((item) => {
            selectKak.innerHTML += `<option value="${item.id}" data-pagu="${item.pagu_awal}" data-sisa="${item.sisa_pagu}">
                ${item.judul_kegiatan} (${item.nama_kamar})
            </option>`;
        });
    } catch (err) {
        selectKak.innerHTML = '<option value="">Gagal memuat KAK</option>';
    }

    // 3. EVENT KETIKA KAK DIPILIH (Munculkan Brankas)
    selectKak.addEventListener('change', function () {
        if (this.value === '') {
            panelBrankas.classList.add('d-none');
            btnSimpan.disabled = true;
            currentSisaPagu = 0;
            return;
        }

        // Ambil data dari atribut <option> yang dipilih
        const selectedOption = this.options[this.selectedIndex];
        const paguAwal = parseFloat(selectedOption.getAttribute('data-pagu')) || 0;
        const sisaPagu = parseFloat(selectedOption.getAttribute('data-sisa')) || 0;
        const realisasi = paguAwal - sisaPagu;

        currentSisaPagu = sisaPagu; // Simpan ke memori

        // Tampilkan ke layar
        document.getElementById('infoPagu').innerText = 'Rp ' + formatRp(paguAwal);
        document.getElementById('infoRealisasi').innerText = 'Rp ' + formatRp(realisasi);
        document.getElementById('infoSisa').innerText = 'Rp ' + formatRp(sisaPagu);

        // Simpan ke input hidden buat dikirim ke tabel dokumen_rab
        document.getElementById('snapshot_pagu').value = paguAwal;
        document.getElementById('snapshot_realisasi').value = realisasi;

        panelBrankas.classList.remove('d-none');
        hitungTotal(); // Panggil ulang hitungan biar validasinya jalan
    });

    // 4. MESIN KALKULATOR LIVE
    const calcTriggers = document.querySelectorAll('.calc-trigger');
    calcTriggers.forEach((input) => {
        input.addEventListener('input', hitungTotal);
    });

    function hitungTotal() {
        // Ambil Nilai Variabel
        const org = parseInt(document.getElementById('jml_orang').value) || 0;
        const keg = parseInt(document.getElementById('jml_kegiatan').value) || 0;
        const hari = parseInt(document.getElementById('jml_hari').value) || 0;
        const volHarian = org * keg * hari;

        // Hitung Uang Harian
        const uhSatuan = bersihRupiah(document.getElementById('uh_satuan').value);
        const uhTotal = volHarian * uhSatuan;
        document.getElementById('rumus_uh').innerText = `Total: (${org} ORG x ${keg} KEG x ${hari} HR) x Rp ${formatRp(uhSatuan)}`;
        document.getElementById('uh_total_tampil').innerText = formatRp(uhTotal);
        document.getElementById('uh_total').value = uhTotal;

        // Hitung Transport
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

        // GRAND TOTAL
        const grandTotal = uhTotal + trTotal + innTotal;
        const tampilGrandTotal = document.getElementById('grand_total_tampil');
        const teksPesan = document.getElementById('pesan_validasi');
        tampilGrandTotal.innerText = 'Rp ' + formatRp(grandTotal);
        document.getElementById('grand_total').value = grandTotal;

        // 5. VALIDASI ANTI-JEBOL! 🛡️
        if (selectKak.value === '') {
            teksPesan.innerText = 'Silakan pilih KAK terlebih dahulu.';
            teksPesan.className = 'fw-bold mt-1 d-block text-warning';
            btnSimpan.disabled = true;
        } else if (grandTotal > currentSisaPagu) {
            // MERAH: OVER BUDGET!
            tampilGrandTotal.classList.add('text-danger');
            teksPesan.innerText = '⚠️ DITOLAK! Total RAB melebihi Sisa Saldo Brankas.';
            teksPesan.className = 'fw-bold mt-1 d-block text-danger';
            btnSimpan.disabled = true; // KUNCI TOMBOL
        } else if (grandTotal <= 0) {
            teksPesan.innerText = 'Masukkan nominal rincian biaya.';
            btnSimpan.disabled = true;
        } else {
            // AMAN: BISA DISIMPAN
            tampilGrandTotal.classList.remove('text-danger');
            teksPesan.innerText = '✅ Saldo mencukupi. RAB siap disimpan.';
            teksPesan.className = 'fw-bold mt-1 d-block text-success';
            btnSimpan.disabled = false; // BUKA KUNCI TOMBOL
        }
    }

    // 6. SUBMIT KE DATABASE (Nanti kita bikin API-nya)
    document.getElementById('formRab').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(document.getElementById('formRab'));
        const data = Object.fromEntries(formData.entries());

        // Bersihkan field satuan dari format titik ribuan (contoh: "250.000" → "250000")
        ['uang_harian_satuan', 'transport_satuan', 'penginapan_satuan'].forEach(key => {
            if (data[key]) data[key] = data[key].replace(/\./g, '');
        });

        try {
            const response = await fetch('/api/rab/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                await Swal.fire({
                    title: 'Berhasil! 💸',
                    text: 'RAB tersimpan dan Saldo Pagu otomatis terpotong!',
                    icon: 'success',
                    confirmButtonColor: '#f59e0b',
                    confirmButtonText: 'OK'
                });
                window.location.reload();
            } else {
                Swal.fire({
                    title: 'Gagal!',
                    text: result.message,
                    icon: 'warning',
                    confirmButtonColor: '#f59e0b'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Terjadi kesalahan sistem saat menyimpan RAB.',
                icon: 'error',
                confirmButtonColor: '#f59e0b'
            });
        }
    });
});
