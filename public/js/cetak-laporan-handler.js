document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); // Ini adalah perjadin_id

    if (!id) {
        Swal.fire('Error!', 'ID Perjalanan Dinas tidak valid!', 'error');
        return;
    }

    try {
        // Fetch Laporan Data
        const resLaporan = await fetch(`/api/laporan/${id}`);
        const dataLaporan = await resLaporan.json();

        // Fetch Perjadin Data untuk rincian pegawai dan surat tugas
        const resPerjadin = await fetch(`/api/perjadin/kuitansi/${id}`);
        const dataPerjadin = await resPerjadin.json();

        if (dataLaporan.success && dataPerjadin.success) {
            const lap = dataLaporan.data;
            const pd = dataPerjadin.data;

            // Update DOM dengan data
            document.getElementById('lblNamaKegiatan').innerText = pd.maksud_dinas.toUpperCase();
            // Format A. Dasar Pelaksanaan
            let dasarText = lap.dasar_pelaksanaan || '';
            const matchNomor = dasarText.match(/Nomor\s*:\s*(.*)/i);
            const matchTanggal = dasarText.match(/Tanggal\s*:\s*(.*)/i);

            if (matchNomor && matchTanggal) {
                let baseText = dasarText.substring(0, matchNomor.index).trim();
                let nomorStr = matchNomor[1].trim();
                let tglStr = matchTanggal[1].trim();
                if (tglStr.endsWith('.')) tglStr = tglStr.substring(0, tglStr.length - 1);

                document.getElementById('viewDasar').innerHTML = `
                    ${baseText}
                    <table class="table table-borderless table-sm w-70 m-0 text-dark mt-1">
                        <tr>
                            <td style="width: 120px; padding-left: 0;">- Nomor Surat</td>
                            <td style="width: 15px;">:</td>
                            <td>${nomorStr}</td>
                        </tr>
                        <tr>
                            <td style="padding-left: 0;">- Tanggal</td>
                            <td>:</td>
                            <td>${tglStr}</td>
                        </tr>
                    </table>
                `;
            } else {
                // Fallback jika format diubah manual
                document.getElementById('viewDasar').innerText = dasarText;
            }
            document.getElementById('viewMaksud').innerText = lap.maksud_tujuan;
            document.getElementById('viewMateri').innerText = lap.materi_kegiatan;
            document.getElementById('viewTempat').innerText = lap.tempat_pelaksanaan;
            // Format Waktu Pelaksanaan
            let strWaktu = lap.waktu_pelaksanaan;
            if (lap.waktu_pelaksanaan) {
                const dateWaktu = new Date(lap.waktu_pelaksanaan);
                if (!isNaN(dateWaktu)) {
                    strWaktu = dateWaktu.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                }
            }
            document.getElementById('viewWaktu').innerText = strWaktu;
            document.getElementById('viewHasil').innerText = lap.hasil_pelaksanaan;

            // Render Tanggal Cetak (Gunakan Tanggal Kepulangan)
            let dateToUse = new Date();
            if (pd.tgl_pulang) {
                dateToUse = new Date(pd.tgl_pulang);
            }
            const strTanggal = dateToUse.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('lblTanggalCetak').innerText = `Tulang Bawang Barat, ${strTanggal}`;

            // Render Tanda Tangan Pelaksana
            const ttdContainer = document.getElementById('containerTandaTangan');
            ttdContainer.innerHTML = '';

            if (pd.listPegawai && pd.listPegawai.length > 0) {
                pd.listPegawai.forEach((pegawai, index) => {
                    const htmlTTD = `
                    <div class="row-ttd d-flex align-items-end mb-4">
                        <div class="identitas-pelaksana">
                            <table class="table table-borderless m-0 p-0 text-dark" style="font-size: 11pt;">
                                <tr>
                                    <td style="width: 25px; padding: 0; vertical-align: top;">${index + 1}.</td>
                                    <td style="padding: 0;">
                                        <span class="fw-bold">${pegawai.nama}</span><br>
                                        <span class="text-muted">NIP. ${pegawai.nip || '-'}</span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div class="space-ttd flex-grow-1 border-bottom-dotted ps-3 text-secondary">
                            ..........................
                        </div>
                    </div>`;
                    ttdContainer.innerHTML += htmlTTD;
                });
            } else {
                ttdContainer.innerHTML = '<p class="text-muted fst-italic">Data pelaksana tidak tersedia.</p>';
            }

            // Render Foto Dokumentasi
            const boxFoto = document.getElementById('boxFotoDokumentasi');
            boxFoto.innerHTML = '';
            if (lap.foto_paths) {
                const arrFoto = lap.foto_paths.split(',');
                arrFoto.forEach((path) => {
                    if (path.trim() !== '') {
                        boxFoto.innerHTML += `
                        <div class="col-4">
                            <img src="${path}" class="img-doc" alt="Dokumentasi">
                        </div>`;
                    }
                });
            } else {
                boxFoto.innerHTML = '<p class="text-muted fst-italic">Tidak ada foto dokumentasi yang dilampirkan.</p>';
            }
        } else {
            Swal.fire('Informasi', 'Data laporan tidak ditemukan atau SPPD ini belum memiliki laporan.', 'info');
        }
    } catch (err) {
        console.error('Error load cetak laporan:', err);
        Swal.fire('Gagal!', 'Terjadi kesalahan sistem.', 'error');
    }
});
