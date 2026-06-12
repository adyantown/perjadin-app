document.addEventListener('DOMContentLoaded', async () => {
    // Muat daftar SPPD yang belum ada laporannya
    const selectSppd = document.querySelector('select[name="perjadin_id"]');
    let dataSppd = [];
    try {
        const res = await fetch('/api/laporan/available');
        const json = await res.json();

        if (json.success && json.data) {
            dataSppd = json.data;
            selectSppd.innerHTML = '<option value="">-- Pilih Surat Tugas Terkait --</option>';
            if (dataSppd.length === 0) {
                selectSppd.innerHTML += '<option value="" disabled>Semua SPPD sudah memiliki laporan atau belum ada SPPD.</option>';
            } else {
                dataSppd.forEach((item) => {
                    const opt = document.createElement('option');
                    opt.value = item.id;
                    opt.textContent = `${item.no_surat_tugas} - ${item.maksud_dinas}`;
                    selectSppd.appendChild(opt);
                });
            }
        }
    } catch (err) {
        console.error('Gagal meload opsi SPPD:', err);
        selectSppd.innerHTML = '<option value="">Gagal memuat data dari server.</option>';
    }

    // Auto-fill form saat dropdown berubah
    selectSppd.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        const selectedData = dataSppd.find((item) => item.id == selectedId);

        if (selectedData) {
            // Helper untuk format tanggal Indonesia
            const formatTgl = (tglStr) => {
                if (!tglStr) return '';
                return new Date(tglStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            };

            const tglSurat = formatTgl(selectedData.tgl_surat_tugas);
            const tglBerangkat = formatTgl(selectedData.tgl_berangkat);
            const tglPulang = formatTgl(selectedData.tgl_pulang);
            let waktuText = tglBerangkat;

            // A. Dasar Pelaksanaan
            document.querySelector('[name="dasar_pelaksanaan"]').value = `Surat Tugas Sekretaris KPU Tulang Bawang Barat \nNomor : ${selectedData.no_surat_tugas}\nTanggal :${tglSurat}.`;
            // B. Maksud dan Tujuan
            document.querySelector('[name="maksud_tujuan"]').value = selectedData.maksud_dinas;
            // D. Tempat Pelaksanaan
            document.querySelector('[name="tempat_pelaksanaan"]').value = selectedData.tujuan;
            // D. Waktu Pelaksanaan
            const fp = document.querySelector('[name="waktu_pelaksanaan"]')._flatpickr;
            if (fp) {
                fp.setDate(selectedData.tgl_berangkat);
            } else {
                document.querySelector('[name="waktu_pelaksanaan"]').value = waktuText;
            }
        } else {
            document.querySelector('[name="dasar_pelaksanaan"]').value = '';
            document.querySelector('[name="maksud_tujuan"]').value = '';
            document.querySelector('[name="tempat_pelaksanaan"]').value = '';

            const fp = document.querySelector('[name="waktu_pelaksanaan"]')._flatpickr;
            if (fp) {
                fp.clear();
            } else {
                document.querySelector('[name="waktu_pelaksanaan"]').value = '';
            }
        }
    });

    // Inisialisasi Flatpickr
    flatpickr('.flatpickr-date', {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'j F Y',
        locale: 'id',
    });
});

document.getElementById('formLaporanPerjadin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Tampilkan loading
    Swal.fire({
        title: 'Menyimpan Laporan...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    try {
        const response = await fetch('/api/laporan/save', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: result.message,
                showConfirmButton: true,
                confirmButtonText: '<i class="bi bi-printer"></i> Cetak Laporan',
                showCancelButton: true,
                cancelButtonText: 'Tutup',
            }).then((res) => {
                if (res.isConfirmed) {
                    window.open(`/cetak_laporan_perjadin.html?id=${formData.get('perjadin_id')}`, '_blank');
                }
                form.reset();
                window.location.reload();
            });
        } else {
            Swal.fire('Gagal!', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Gagal!', 'Terjadi kesalahan sistem atau koneksi.', 'error');
    }
});
