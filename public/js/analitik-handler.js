// Variabel global untuk menampung instansi grafik (agar bisa di-reset)
// Variabel global untuk menampung instansi grafik
let chartPerjadin = null;

// Biarkan kosong karena kita menunggu user klik radio button dulu
document.addEventListener('DOMContentLoaded', () => {
    // Tidak otomatis load semua nama lagi
});

// 1. FUNGSI BARU: Load Pegawai Berdasarkan Kategori
async function loadPegawaiKategori(kategori) {
    const select = document.getElementById('selectPegawai');
    const wadah = document.getElementById('wadahAnalitik');

    // Sembunyikan dashboard laporan kalau user ganti kategori (biar datanya nggak ketukar)
    wadah.style.display = 'none';
    select.innerHTML = '<option value="">-- Memuat Data... --</option>';

    try {
        // Tarik data API sesuai kategori yang diklik (PNS/PPPK/Komisioner)
        const res = await fetch(`/api/pegawai/${kategori}`);
        const data = await res.json();

        // Urutkan nama berdasarkan abjad biar rapi
        data.sort((a, b) => a.nama_pegawai.localeCompare(b.nama_pegawai));

        select.innerHTML = `<option value="">-- Pilih Nama ${kategori} --</option>`;

        if (data.length === 0) {
            select.innerHTML = `<option value="">-- Belum ada data ${kategori} --</option>`;
            return;
        }

        data.forEach((p) => {
            select.innerHTML += `<option value="${p.id}">${p.nama_pegawai}</option>`;
        });
    } catch (e) {
        console.error('Error load pegawai:', e);
        select.innerHTML = '<option value="">Gagal memuat data pegawai</option>';
    }
}

// ... (Biarkan Fungsi No. 2, 3, 4, dan 5 tetap seperti aslinya) ...

// 2. Fungsi Utama saat Pegawai Dipilih
async function loadDataAnalitik() {
    const pegawaiId = document.getElementById('selectPegawai').value;
    const wadah = document.getElementById('wadahAnalitik');

    if (!pegawaiId) {
        wadah.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`/api/perjadin/analitik/${pegawaiId}`);
        const result = await res.json();

        if (result.success) {
            wadah.style.display = 'block'; // Tampilkan dashboard
            kalkulasiData(result.data);
            renderTabelRiwayat(result.data);
            renderGrafik(result.data);
        }
    } catch (e) {
        console.error('Error load analitik:', e);
        alert('Gagal mengambil data analitik dari server.');
    }
}

// 3. Kalkulasi Angka untuk Scorecards
// 3. Kalkulasi Angka untuk Scorecards
function kalkulasiData(data) {
    let uangHarian = 0;
    let transport = 0;
    let grandTotal = 0;

    data.forEach((item) => {
        const jmlRombongan = item.jumlah_sppd || 1;

        // 1. Hitung Durasi (Sama seperti rumus di Backend)
        let durasi = 0;
        if (item.tgl_berangkat && item.tgl_pulang) {
            const tglB = new Date(item.tgl_berangkat);
            const tglP = new Date(item.tgl_pulang);
            if (!isNaN(tglB) && !isNaN(tglP)) {
                durasi = Math.ceil((tglP - tglB) / (1000 * 60 * 60 * 24)) + 1;
            }
        }
        durasi = durasi > 0 ? durasi : 1; // Minimal 1 hari

        // 2. Hitung Hak Individu
        // Uang Harian = Tarif utuh per orang dikali jumlah hari
        const uangHarianIndividu = (parseInt(item.uang_harian) || 0) * durasi;

        // Transport = Total biaya sewa mobil/bensin dibagi rata jumlah orang yang ikut
        const transportIndividu = (parseInt(item.biaya_transportasi) || 0) / jmlRombongan;

        // Grand Total Individu = Total biaya rombongan di database dibagi rata
        const biayaIndividu = (parseInt(item.total_biaya) || 0) / jmlRombongan;

        uangHarian += uangHarianIndividu;
        transport += transportIndividu;
        grandTotal += biayaIndividu;
    });

    const rp = (num) => 'Rp ' + Math.round(num).toLocaleString('id-ID');

    document.getElementById('cardTotalJalan').innerText = data.length;
    document.getElementById('cardUangHarian').innerText = rp(uangHarian);
    document.getElementById('cardTransport').innerText = rp(transport);
    document.getElementById('cardGrandTotal').innerText = rp(grandTotal);
}

// 4. Render Tabel Jejak Langkah
function renderTabelRiwayat(data) {
    const tbody = document.getElementById('tabelRiwayat');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Belum ada riwayat perjalanan dinas.</td></tr>';
        return;
    }

    data.forEach((item) => {
        const jmlRombongan = item.jumlah_sppd || 1;
        const biayaIndividu = (parseInt(item.total_biaya) || 0) / jmlRombongan;

        tbody.innerHTML += `
            <tr>
                <td class="text-nowrap">${formatTanggalIndo(item.tgl_berangkat)}</td>
                <td class="fw-bold">${item.no_surat_tugas}</td>
                <td>${item.tujuan}</td>
                <td><small>${item.maksud_dinas}</small></td>
                <td class="text-end fw-bold text-danger">Rp ${Math.round(biayaIndividu).toLocaleString('id-ID')}</td>
            </tr>
        `;
    });
}

// 5. Render Grafik (Chart.js)
function renderGrafik(data) {
    const ctx = document.getElementById('grafikPerjadin').getContext('2d');

    // Hancurkan grafik lama kalau ada (biar gak numpuk pas ganti orang)
    if (chartPerjadin) {
        chartPerjadin.destroy();
    }

    // Siapkan wadah bulan (Jan - Des)
    const bulanLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const dataPerBulan = new Array(12).fill(0);

    data.forEach((item) => {
        if (item.tgl_berangkat) {
            const date = new Date(item.tgl_berangkat);
            const bulanIndex = date.getMonth(); // 0 = Jan, 11 = Des
            if (!isNaN(bulanIndex)) {
                dataPerBulan[bulanIndex] += 1; // Tambah 1 kegiatan di bulan tersebut
            }
        }
    });

    chartPerjadin = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bulanLabels,
            datasets: [
                {
                    label: 'Jumlah Perjalanan Dinas',
                    data: dataPerBulan,
                    backgroundColor: 'rgba(13, 110, 253, 0.7)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
            },
        },
    });
}
