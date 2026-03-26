document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idRab = urlParams.get('id');
    if (!idRab) { alert('ID RAB tidak ditemukan!'); return; }

    const formatRp = (angka) => new Intl.NumberFormat('id-ID').format(angka);

    try {
        const response = await fetch(`/api/rab/view/${idRab}`);
        const result = await response.json();

        if (result.success && result.data) {
            const d = result.data;

            const dateObj = new Date(d.tgl_rab);
            const tglIndo = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('c_tahun').innerText = dateObj.getFullYear();
            document.getElementById('c_tgl').innerText = tglIndo;

            // INI DIA MAPPING SESUAI REQUEST MAS ADY!
            // Baris 1: Program
            document.getElementById('c_prog_kode').innerText = d.program_kode || '-';
            document.getElementById('c_prog_nama').innerText = d.program_nama || '-';

            // Baris 2: Kegiatan / KRO (Menggunakan kode 3360.EBA.994 sesuai foto)
            document.getElementById('c_keg_kode').innerText = d.kro_kode || d.kegiatan_kode || '-';
            document.getElementById('c_keg_nama').innerText = d.kegiatan_nama || '-';

            // Baris 3: Komponen (Menggunakan kode 002 sesuai foto)
            document.getElementById('c_komp_kode').innerText = d.komponen_kode || '-';
            document.getElementById('c_komp_nama').innerText = d.komponen_nama || '-';

            // Baris 4: Akun & Judul KAK
            document.getElementById('c_akun_nama').innerHTML = `Belanja Perjalanan Dinas Biasa<br><br><span style="font-weight: normal; font-style: italic;">${d.judul_kegiatan}</span>`;

            // Info PPK
            document.getElementById('c_nama_ppk').innerText = d.ppk_nama;
            document.getElementById('c_nip_ppk').innerText = d.ppk_nip;

            // Brankas & Hitungan
            document.getElementById('c_pagu').innerText = formatRp(d.snapshot_pagu);
            document.getElementById('c_realisasi').innerText = formatRp(d.snapshot_realisasi);
            document.getElementById('c_total_rab').innerText = formatRp(d.total_rab);

            const sisaAkhir = d.snapshot_pagu - d.snapshot_realisasi - d.total_rab;
            document.getElementById('c_sisa_akhir').innerText = formatRp(sisaAkhir);

            // Rincian Variabel
            document.getElementById('c_var_org').innerText = d.jml_orang;
            document.getElementById('c_var_keg').innerText = d.jml_kegiatan;
            document.getElementById('c_var_hr').innerText = d.jml_hari;
            document.getElementById('c_vol_uh').innerText = (d.jml_orang * d.jml_kegiatan * d.jml_hari);
            document.getElementById('c_satuan_uh').innerText = formatRp(d.uang_harian_satuan);
            document.getElementById('c_biaya_uh').innerText = formatRp(d.uang_harian_total);

            document.getElementById('c_jenis_transport').innerText = d.jenis_transport;
            document.getElementById('c_vol_tr').innerText = d.transport_vol;
            document.getElementById('c_satuan_tr').innerText = formatRp(d.transport_satuan);
            document.getElementById('c_biaya_tr').innerText = formatRp(d.transport_total);

            setTimeout(() => { window.print(); }, 800);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
