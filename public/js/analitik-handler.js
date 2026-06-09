// public/js/analitik-handler.js

let chartPerjadin = null;
let allRankingData = []; // Semua data ranking
let activeFilter = 'Semua';
let activePegawaiId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadRanking();
});

// 1. LOAD RANKING PEGAWAI
async function loadRanking() {
    const tbody = document.getElementById('tabelRanking');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Sedang memuat data ranking...</td></tr>';

    try {
        const res = await fetch('/api/perjadin/ranking');
        const result = await res.json();

        if (result.success) {
            allRankingData = result.data;
            renderRanking(allRankingData);
        }
    } catch (e) {
        console.error('Error load ranking:', e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-3">Gagal memuat data ranking.</td></tr>';
    }
}

// 2. RENDER TABEL RANKING
function renderRanking(data) {
    const tbody = document.getElementById('tabelRanking');
    tbody.innerHTML = '';

    // Filter berdasarkan kategori aktif
    const filtered = activeFilter === 'Semua' ? data : data.filter(d => d.kategori === activeFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Tidak ada data pegawai.</td></tr>';
        return;
    }

    // Cari nilai maksimum untuk progress bar
    const maxPerjadin = Math.max(...filtered.map(d => d.total_perjadin), 1);

    const rp = (num) => 'Rp ' + Math.round(num).toLocaleString('id-ID');

    filtered.forEach((item, index) => {
        // Badge kategori
        let badgeClass = 'bg-secondary';
        if (item.kategori === 'PNS') badgeClass = 'bg-primary';
        if (item.kategori === 'PPPK') badgeClass = 'bg-warning text-dark';
        if (item.kategori === 'Komisioner') badgeClass = 'bg-danger';

        // Ranking badge
        let rankClass = 'rank-default';
        if (index === 0) rankClass = 'rank-gold';
        else if (index === 1) rankClass = 'rank-silver';
        else if (index === 2) rankClass = 'rank-bronze';

        // Progress bar width
        const barWidth = maxPerjadin > 0 ? (item.total_perjadin / maxPerjadin) * 100 : 0;

        const isActive = item.id === activePegawaiId;

        const row = document.createElement('tr');
        row.className = `ranking-row${isActive ? ' active-row' : ''}`;
        row.onclick = () => loadDetailPegawai(item.id, item.nama_pegawai);
        row.innerHTML = `
            <td class="text-center">
                <span class="badge-rank ${rankClass}">${index + 1}</span>
            </td>
            <td>
                <div class="fw-bold">${item.nama_pegawai}</div>
            </td>
            <td><span class="badge ${badgeClass} rounded-pill" style="font-size: 0.75rem;">${item.kategori}</span></td>
            <td><small class="text-muted">${item.jabatan || '-'}</small></td>
            <td class="text-center">
                <div class="fw-bold text-dark mb-1">${item.total_perjadin} <small class="text-muted fw-normal">kali</small></div>
                <div class="progress-bar-perjadin">
                    <div class="fill" style="width: ${barWidth}%"></div>
                </div>
            </td>
            <td class="text-end text-nowrap">
                <small class="fw-bold ${item.total_anggaran > 0 ? 'text-danger' : 'text-muted'}">${item.total_anggaran > 0 ? rp(item.total_anggaran) : '-'}</small>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 3. FILTER KATEGORI
function filterKategori(btn) {
    // Toggle active state
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    activeFilter = btn.getAttribute('data-filter');
    renderRanking(allRankingData);
}

// 4. LOAD DETAIL PEGAWAI (Saat klik baris ranking)
async function loadDetailPegawai(pegawaiId, pegawaiName) {
    activePegawaiId = pegawaiId;
    renderRanking(allRankingData); // Re-render untuk update highlight

    const wadah = document.getElementById('wadahAnalitik');
    document.getElementById('namaPegawaiDetail').innerText = pegawaiName;

    try {
        const res = await fetch(`/api/perjadin/analitik/${pegawaiId}`);
        const result = await res.json();

        if (result.success) {
            wadah.style.display = 'block';
            kalkulasiData(result.data, pegawaiName);
            renderTabelRiwayat(result.data, pegawaiName);
            renderGrafik(result.data);

            // Scroll ke detail
            wadah.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (e) {
        console.error('Error load analitik:', e);
    }
}

// 5. TUTUP DETAIL
function tutupDetail() {
    document.getElementById('wadahAnalitik').style.display = 'none';
    activePegawaiId = null;
    renderRanking(allRankingData);
}

// 6. Kalkulasi Angka untuk Scorecards
function kalkulasiData(data, pegawaiName) {
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

        // Cek apakah pegawai ini adalah nama pertama (Ketua Rombongan)
        let isFirstPerson = false;
        if (item.nama_pegawai) {
            let list = [];
            if (item.nama_pegawai.includes('|||')) {
                list = item.nama_pegawai.split('|||').map(n => n.trim());
            } else {
                list = item.nama_pegawai.split(',').map(n => n.trim());
            }
            if (list.length > 0 && list[0] === pegawaiName.trim()) {
                isFirstPerson = true;
            }
        }

        // 2. Hitung Hak Individu
        // Uang Harian = Tarif utuh per orang dikali jumlah hari
        const uangHarianIndividu = (parseInt(item.uang_harian) || 0) * durasi;

        // Transport = Cek Jenis Transportasi
        const jenisTransport = item.jenis_transportasi || 'Kendaraan/Pribadi';
        const totalTransport = parseInt(item.biaya_transportasi) || 0;
        
        let transportIndividu = 0;
        if (jenisTransport.includes('Angkutan Umum')) {
            transportIndividu = totalTransport / jmlRombongan;
        } else {
            transportIndividu = isFirstPerson ? totalTransport : 0;
        }

        // Grand Total Individu = Uang harian + Transport (jika ada) + (Sisa biaya / jmlRombongan)
        const totalSemua = parseInt(item.total_biaya) || 0;
        const biayaSisaBagiRata = (totalSemua - totalTransport) / jmlRombongan;
        const biayaIndividu = biayaSisaBagiRata + transportIndividu;

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

// 7. Render Tabel Jejak Langkah
function renderTabelRiwayat(data, pegawaiName) {
    const tbody = document.getElementById('tabelRiwayat');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Belum ada riwayat perjalanan dinas.</td></tr>';
        return;
    }

    data.forEach((item) => {
        const jmlRombongan = item.jumlah_sppd || 1;
        
        let isFirstPerson = false;
        if (item.nama_pegawai) {
            let list = [];
            if (item.nama_pegawai.includes('|||')) {
                list = item.nama_pegawai.split('|||').map(n => n.trim());
            } else {
                list = item.nama_pegawai.split(',').map(n => n.trim());
            }
            if (list.length > 0 && list[0] === pegawaiName.trim()) {
                isFirstPerson = true;
            }
        }

        const totalSemua = parseInt(item.total_biaya) || 0;
        const totalTransport = parseInt(item.biaya_transportasi) || 0;
        const jenisTransport = item.jenis_transportasi || 'Kendaraan/Pribadi';
        
        let transportIndividu = 0;
        if (jenisTransport.includes('Angkutan Umum')) {
            transportIndividu = totalTransport / jmlRombongan;
        } else {
            transportIndividu = isFirstPerson ? totalTransport : 0;
        }

        const biayaSisaBagiRata = (totalSemua - totalTransport) / jmlRombongan;
        const biayaIndividu = biayaSisaBagiRata + transportIndividu;

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

// 8. Render Grafik (Chart.js)
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
