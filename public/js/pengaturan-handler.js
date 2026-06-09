document.addEventListener('DOMContentLoaded', async () => {
    // Load Data Saat Buka
    try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success) {
            const d = json.data;
            const f = document.getElementById('formSetting');
            f.ppk_nama.value = d.ppk_nama || '';
            f.ppk_nip.value = d.ppk_nip || '';
            f.bendahara_nama.value = d.bendahara_nama || '';
            f.bendahara_nip.value = d.bendahara_nip || '';
            f.ketua_nama.value = d.ketua_nama || '';
            f.ketua_nip.value = d.ketua_nip || '';
        }
    } catch (err) { console.error(err); }

    // Simpan Data
    document.getElementById('formSetting').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            Swal.fire({ title: json.success ? 'Berhasil!' : 'Info', text: json.message, icon: json.success ? 'success' : 'info', timer: 1500, showConfirmButton: false });
        } catch (err) { Swal.fire('Gagal!', 'Gagal menyimpan pengaturan.', 'error'); }
    });
});
