/**
 * Cetak Kuitansi Handler
 * - Mengambil data perjadin + settings
 * - Render kuitansi per pegawai ke #render_area
 */

// ═══════════════════════════════════════════════════════
//  HELPER: Konversi angka ke terbilang (Bahasa Indonesia)
// ═══════════════════════════════════════════════════════
function terbilang(n) {
    const m = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (n < 12) return ' ' + m[n];
    if (n < 20) return terbilang(n - 10) + ' Belas';
    if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh' + terbilang(n % 10);
    if (n < 200) return ' Seratus' + terbilang(n - 100);
    if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus' + terbilang(n % 100);
    if (n < 2000) return ' Seribu' + terbilang(n - 1000);
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu' + terbilang(n % 1000);
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta' + terbilang(n % 1000000);
    return '...';
}

// ═══════════════════════════════════════════════════════
//  HELPER: Format tanggal Indonesia
// ═══════════════════════════════════════════════════════
function formatTanggalID(dateStr) {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ═══════════════════════════════════════════════════════
//  HELPER: Render 1 baris rincian biaya
// ═══════════════════════════════════════════════════════
function buatBarisRincian(noUrut, uraian, jumlah, keterangan) {
    return `<tr><td class="text-center">${noUrut}</td><td>${uraian}</td><td>Rp ${Math.round(Number(jumlah) || 0).toLocaleString('id-ID')}</td><td>${keterangan}</td></tr>`;
}

// ═══════════════════════════════════════════════════════
//  HELPER: Render 1 lembar kuitansi per pegawai
// ═══════════════════════════════════════════════════════
function renderKuitansi(data, pegawai, index, pejabat) {
    let htmlRincian = '';
    let total = 0;
    let noUrut = 1;

    // 1. Uang Harian
    const uangHarian = Math.round(Number(data.uang_harian) || 0);
    const harianTotal = uangHarian * data.lama_hari;
    const ketHarian = data.ket_harian || 'Uang Harian';
    total += harianTotal;
    htmlRincian += buatBarisRincian(noUrut++, `Uang Harian (${data.lama_hari} hari x Rp ${uangHarian.toLocaleString('id-ID')})`, harianTotal, ketHarian);

    // 2. Rincian Transportasi (Render per komponen, hanya yang > 0)
    const jenisTransport = data.jenis_transportasi || 'Kendaraan Dinas/Pribadi';
    const isAngkutanUmum = jenisTransport.includes('Angkutan Umum');
    const jmlPegawai = data.listPegawai ? data.listPegawai.length : 1;

    const komponenTransport = [
        { label: 'Biaya BBM', nilai: Math.round(Number(data.biaya_bbm) || 0), ket: data.ket_bbm || '' },
        { label: 'Biaya Tol', nilai: Math.round(Number(data.biaya_tol) || 0), ket: data.ket_tol || '' },
        { label: 'Biaya Transportasi', nilai: Math.round(Number(data.biaya_tiket) || 0), ket: data.ket_tiket || '' },
        { label: 'Biaya Parkir / Retribusi', nilai: Math.round(Number(data.biaya_parkir) || 0), ket: data.ket_parkir || '' },
    ];

    komponenTransport.forEach((item) => {
        if (item.nilai > 0) {
            let nilaiPrint = item.nilai;
            // Gunakan keterangan custom jika ada, jika tidak pakai label default
            let ket = item.ket || item.label;

            if (isAngkutanUmum) {
                nilaiPrint = item.nilai / jmlPegawai;
                ket += ' (1/' + jmlPegawai + ' orang)';
            } else {
                if (index !== 0) {
                    nilaiPrint = 0;
                    ket += ' (Ikut kend. ketua)';
                }
            }

            total += nilaiPrint;
            htmlRincian += buatBarisRincian(noUrut++, item.label, nilaiPrint, ket);
        }
    });

    // 3. Penginapan
    if (data.uang_penginapan > 0) {
        let penginapan = Math.round(Number(data.uang_penginapan) || 0);

        // Bangun keterangan dinamis: Nama Hotel + Jumlah Malam
        let ketHotel = 'Hotel/Losmen';
        if (data.nama_hotel) {
            ketHotel = data.nama_hotel;
            if (data.tgl_checkin && data.tgl_checkout) {
                const checkin = new Date(data.tgl_checkin);
                const checkout = new Date(data.tgl_checkout);
                const jumlahMalam = Math.round((checkout - checkin) / (1000 * 60 * 60 * 24));
                if (jumlahMalam > 0) {
                    ketHotel += ` (${jumlahMalam} Malam)`;
                }
            }
        }

        // Logika Kamar Bersama vs Masing-Masing via pembayar_hotel indices
        const pembayarIndices = (data.pembayar_hotel || '0').split(',').map((s) => parseInt(s.trim()));
        if (!pembayarIndices.includes(index)) {
            penginapan = 0;
            ketHotel += ' (Ikut kamar pelaksana lain)';
        }

        total += penginapan;
        htmlRincian += buatBarisRincian(noUrut++, 'Biaya Penginapan', penginapan, ketHotel);
    }

    const totalStr = Math.round(total).toLocaleString('id-ID');
    const tglSurat = formatTanggalID(data.tgl_surat_tugas);
    const tglHariIni = formatTanggalID(new Date());

    return `
    <div class="kertas-kuitansi">
        <div class="header-kpu pb-3 mb-4 position-relative" style="border-bottom: 3px double black; min-height: 110px;">
            <img src="/img/kpu_logo.png" class="logo-kpu position-absolute" alt="Logo KPU" style="width: 100px; height: auto; left: 0; top: 50%; transform: translateY(-50%);">
            <div class="teks-header text-center w-100">
                <h5 class="m-0 fw-bold" style="font-size: 16pt;">KOMISI PEMILIHAN UMUM</h5>
                <h5 class="m-0 fw-bold" style="font-size: 16pt;">KABUPATEN TULANG BAWANG BARAT</h5>
                <small style="font-size: 11pt;">Jalan KH. Ahmad Dahlan Candra Mukti Tulang Bawang Tengah<br>
                    Kabupaten Tulang Bawang Barat Kode Pos : 34793<br>
                    Telp:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Email : kab_tulangbawangbarat@kpu.go.id</small>
            </div>
        </div>

        <div class="text-center mb-4">
            <h5 class="fw-bold text-decoration-underline m-0">RINCIAN BIAYA PERJALANAN DINAS</h5>
        </div>

        <div class="row mb-3">
            <div class="col-8">
                <table>
                    <tr><td width="150">Lampiran Nomor SPD</td><td>: ${data.no_surat_tugas || '-'}</td></tr>
                    <tr><td>Tanggal</td><td>: ${tglSurat}</td></tr>
                </table>
            </div>
        </div>

        <table class="table-rincian">
            <thead>
                <tr class="text-center bg-light">
                    <th width="50">No</th>
                    <th>Uraian Rincian Biaya</th>
                    <th width="200">Jumlah</th>
                    <th width="150">Keterangan</th>
                </tr>
            </thead>
            <tbody>
                ${htmlRincian}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2" class="text-center fw-bold">JUMLAH</td>
                    <td class="fw-bold">Rp ${totalStr}</td>
                    <td class="bg-light"></td>
                </tr>
            </tfoot>
        </table>

        <div class="terbilang-box">
            Terbilang: <span class="fst-italic">${terbilang(total)} Rupiah</span>
        </div>

        <div class="text-end mt-4">
            <p class="m-0">Candra Mukti, ${tglHariIni}</p>
        </div>

        <div class="d-flex justify-content-between mt-4">
            <div class="text-center" style="width: 45%;">
                <p class="mb-0">Telah dibayar sejumlah Rp ${totalStr}</p>
                <p class="fw-bold">Bendahara Pengeluaran,</p>
                <div style="height: 70px;"></div>
                <div style="width: 100%; overflow: hidden;">
                    <p class="m-0 fw-bold" style="${pejabat.bendaharaNama.length > 28 ? 'font-size: 9pt;' : 'font-size: 11pt;'} white-space: nowrap;">${pejabat.bendaharaNama}</p>
                    <p class="m-0" style="${pejabat.bendaharaNip.length > 28 ? 'font-size: 9pt;' : 'font-size: 11pt;'} white-space: nowrap;">NIP. ${pejabat.bendaharaNip}</p>
                </div>
            </div>

            <div class="text-center" style="width: 45%;">
                <p class="mb-0">Telah menerima jumlah uang Rp ${totalStr}</p>
                <p class="fw-bold">Yang Menerima,</p>
                <div style="height: 70px;"></div>
                <div style="width: 100%; overflow: hidden;">
                    <p class="m-0 fw-bold" style="${pegawai.nama.length > 28 ? 'font-size: 9pt;' : 'font-size: 11pt;'} white-space: nowrap;">${pegawai.nama}</p>
                    <p class="m-0" style="${pegawai.nip && pegawai.nip.length > 28 ? 'font-size: 9pt;' : 'font-size: 11pt;'} white-space: nowrap;">NIP. ${pegawai.nip || '-'}</p>
                </div>
            </div>
        </div>

        <hr style="border: 1px solid black; opacity: 1; margin: 30px 0;">

        <div class="d-flex justify-content-between align-items-start">
            
            <div style="width: 55%;">
                <h6 class="fw-bold m-0 mb-2">PERHITUNGAN SPD RAMPUNG</h6>
                <table class="table table-sm table-borderless text-start m-0 p-0" style="font-size: 10pt;">
                    <tr>
                        <td width="180">Ditetapkan sejumlah</td>
                        <td>: Rp ${totalStr}</td>
                    </tr>
                    <tr>
                        <td>Yang Telah dibayar semula</td>
                        <td>: Rp ${totalStr}</td>
                    </tr>
                    <tr>
                        <td>Sisa Kurang/Lebih *)</td>
                        <td>: NIHIL</td>
                    </tr>
                </table>
            </div>

            <div class="text-center" style="width: 40%;">
                <p class="mb-0">Setuju dibebankan pada mata anggaran berkenaan,</p>
                <p class="fw-bold">Pejabat Pembuat Komitmen,</p>
                <div style="height: 70px;"></div>
                <div style="width: 100%; overflow: hidden;">
                    <p class="m-0 fw-bold text-decoration-underline" style="${pejabat.ppkNama.length > 28 ? 'font-size: 9pt;' : 'font-size: 11pt;'} white-space: nowrap;">${pejabat.ppkNama}</p>
                    <p class="m-0" style="${pejabat.ppkNip.length > 28 ? 'font-size: 9pt;' : 'font-size: 11pt;'} white-space: nowrap;">NIP. ${pejabat.ppkNip}</p>
                </div>
            </div>

        </div>
    </div>
    `;
}

// ═══════════════════════════════════════════════════════
//  MAIN: Fetch data & render semua kuitansi
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return Swal.fire('Error!', 'ID Perjadin tidak ditemukan!', 'error');

    try {
        const res = await fetch(`/api/perjadin/kuitansi/${id}`);
        const { success, data } = await res.json();

        if (success) {
            const renderArea = document.getElementById('render_area');

            // Default Pejabat
            const pejabat = {
                ppkNama: '...',
                ppkNip: '...',
                bendaharaNama: 'Andriyanto, S.E',
                bendaharaNip: '19841005 201101 1 004',
            };

            // Fetch settings
            const resSet = await fetch('/api/settings');
            const setObj = await resSet.json();
            if (setObj.success && setObj.data) {
                pejabat.ppkNama = setObj.data.ppk_nama || pejabat.ppkNama;
                pejabat.ppkNip = setObj.data.ppk_nip || pejabat.ppkNip;
                pejabat.bendaharaNama = setObj.data.bendahara_nama || pejabat.bendaharaNama;
                pejabat.bendaharaNip = setObj.data.bendahara_nip || pejabat.bendaharaNip;
            }

            // Render 1 kuitansi per pegawai
            const allHTML = data.listPegawai.map((pegawai, index) => renderKuitansi(data, pegawai, index, pejabat)).join('');

            renderArea.innerHTML = allHTML;
        }
    } catch (err) {
        console.error('Gagal cetak:', err);
    }
});
