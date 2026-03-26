document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/logs');
        const json = await res.json();
        const tbody = document.getElementById('logTableBody');
        tbody.innerHTML = '';

        if (json.success && json.data.length > 0) {
            json.data.forEach(log => {
                // Pakai helper format tanggal & jam
                const tgl = new Date(log.waktu);
                const formatWaktu = `${tgl.toLocaleDateString('id-ID')} ${tgl.toLocaleTimeString('id-ID')}`;

                // Beri warna badge sesuai role
                const roleBadge = log.role === 'admin' ? 'bg-danger' : 'bg-primary';

                tbody.innerHTML += `
                    <tr>
                        <td class="text-muted small">${formatWaktu}</td>
                        <td>
                            <span class="fw-bold">${log.nama_user}</span><br>
                            <span class="badge ${roleBadge} rounded-pill" style="font-size: 10px;">${log.role}</span>
                        </td>
                        <td><span class="fw-bold text-dark">${log.aksi}</span></td>
                        <td class="text-muted small">${log.keterangan}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada aktivitas yang terekam.</td></tr>';
        }
    } catch (err) {
        document.getElementById('logTableBody').innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat log sistem.</td></tr>';
    }
});
