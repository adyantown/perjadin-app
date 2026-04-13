/**
 * Cetak Kuitansi Handler
 * - Mengambil data perjadin + settings
 * - Render kuitansi per pegawai ke #render_area
 */

// ═══════════════════════════════════════════════════════
//  HELPER: Konversi angka ke terbilang (Bahasa Indonesia)
// ═══════════════════════════════════════════════════════
function terbilang(n) {
    const m = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    if (n < 12) return " " + m[n];
    if (n < 20) return terbilang(n - 10) + " Belas";
    if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh" + terbilang(n % 10);
    if (n < 200) return " Seratus" + terbilang(n - 100);
    if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus" + terbilang(n % 100);
    if (n < 2000) return " Seribu" + terbilang(n - 1000);
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu" + terbilang(n % 1000);
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta" + terbilang(n % 1000000);
    return "...";
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
    return `<tr><td class="text-center">${noUrut}</td><td>${uraian}</td><td>Rp ${jumlah.toLocaleString('id-ID')}</td><td>${keterangan}</td></tr>`;
}

// ═══════════════════════════════════════════════════════
//  HELPER: Render 1 lembar kuitansi per pegawai
// ═══════════════════════════════════════════════════════
function renderKuitansi(data, pegawai, index, pejabat) {
    let htmlRincian = '';
    let total = 0;
    let noUrut = 1;

    // 1. Uang Harian
    const harianTotal = data.uang_harian * data.lama_hari;
    total += harianTotal;
    htmlRincian += buatBarisRincian(
        noUrut++,
        `Uang Harian (${data.lama_hari} hari x Rp ${parseInt(data.uang_harian).toLocaleString('id-ID')})`,
        harianTotal,
        'Uang Harian'
    );

    // 2. Transport (hanya orang pertama yang kena biaya penuh)
    if (index === 0 && data.uang_transport > 0) {
        total += parseInt(data.uang_transport);
        htmlRincian += buatBarisRincian(noUrut++, 'Biaya Transport/Tiket', parseInt(data.uang_transport), 'Transport');
    } else if (index > 0 && data.uang_transport > 0) {
        htmlRincian += buatBarisRincian(noUrut++, 'Biaya Transport/Tiket', 0, 'Ikut Kend. Dinas / Ketua');
    }

    // 3. Penginapan
    if (data.uang_penginapan > 0) {
        total += parseInt(data.uang_penginapan);
        htmlRincian += buatBarisRincian(noUrut++, 'Biaya Penginapan', parseInt(data.uang_penginapan), 'Hotel/Losmen');
    }

    const totalStr = total.toLocaleString('id-ID');
    const tglSurat = formatTanggalID(data.tgl_st);
    const tglHariIni = formatTanggalID(new Date());

    return `
    <div class="kertas-kuitansi">
        <div class="header-kpu d-flex align-items-center">
            <img src="/img/kpu_logo.png" class="logo-kpu me-3" alt="Logo KPU">
            <div class="teks-header w-100">
                <h5 class="m-0 fw-bold">KOMISI PEMILIHAN UMUM</h5>
                <h5 class="m-0 fw-bold">KABUPATEN TULANG BAWANG BARAT</h5>
                <small>Jalan KH Ahmad Dahlan Candra Mukti Tulang Bawang Tengah<br>
                    Kabupaten Tulang Bawang Barat Kode Pos : 34793<br>
                    Telp : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Email : kab_tulangbawangbarat@kpu.go.id</small>
            </div>
        </div>

        <div class="text-center mb-4">
            <h5 class="fw-bold text-decoration-underline m-0">RINCIAN BIAYA PERJALANAN DINAS</h5>
        </div>

        <div class="row mb-3">
            <div class="col-8">
                <table>
                    <tr><td width="150">Lampiran Nomor SPD</td><td>: ${data.nomor_st || '-'}</td></tr>
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
                <p class="m-0 fw-bold">${pejabat.bendaharaNama}</p>
                <p class="m-0">NIP. ${pejabat.bendaharaNip}</p>
            </div>

            <div class="text-center" style="width: 45%;">
                <p class="mb-0">Telah menerima jumlah uang Rp ${totalStr}</p>
                <p class="fw-bold">Yang Menerima,</p>
                <div style="height: 70px;"></div>
                <p class="m-0 fw-bold">${pegawai.nama}</p>
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
                        <td>: (xxxxxxxxxxxxx)</td>
                    </tr>
                </table>
            </div>

            <div class="text-center" style="width: 40%;">
                <p class="mb-0">Setuju dibebankan pada mata anggaran berkenaan,</p>
                <p class="fw-bold">Pejabat Pembuat Komitmen,</p>
                <div style="height: 70px;"></div>
                <p class="m-0 fw-bold text-decoration-underline">${pejabat.ppkNama}</p>
                <p class="m-0">NIP. ${pejabat.ppkNip}</p>
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
    if (!id) return alert("ID Perjadin tidak ditemukan!");

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
                bendaharaNip: '19841005 201101 1 004'
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
            const allHTML = data.listPegawai
                .map((pegawai, index) => renderKuitansi(data, pegawai, index, pejabat))
                .join('');

            renderArea.innerHTML = allHTML;
        }
    } catch (err) {
        console.error("Gagal cetak:", err);
    }
});
