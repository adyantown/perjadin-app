# Aplikasi Administrasi Perjalanan Dinas

Aplikasi web untuk membantu pengelolaan administrasi perjalanan dinas di lingkungan KPU. Aplikasi mencakup penyusunan dokumen dan anggaran, pencatatan perjalanan, pembuatan laporan, pengumpulan SPJ, serta verifikasi oleh admin.

## Alur dan kemampuan aplikasi

| Tahap | Kemampuan |
| --- | --- |
| KAK | Membuat, melihat riwayat, mengubah, menghapus, dan mencetak Kerangka Acuan Kerja. |
| RAB | Menyusun Rencana Anggaran Biaya berdasarkan KAK, melihat riwayat, mencetak dokumen, serta menyesuaikan pagu saat RAB dibuat, diubah, atau dihapus. |
| Perjalanan dinas | Mencatat Surat Tugas dan data perjalanan, termasuk pegawai, tujuan, tanggal, transportasi, penginapan, serta rincian biaya. Data dapat dilihat dan diubah. |
| SPPD dan kuitansi | Mengelola data SPPD serta melihat dan mencetak kuitansi perjalanan dinas. |
| Laporan perjalanan | Membuat laporan kegiatan yang terkait dengan perjalanan dinas, melampirkan hingga 3 foto dokumentasi, serta melihat atau mencetak laporan. |
| Upload SPJ | Mengunggah satu PDF berisi laporan dan bukti pendukung. Batas ukuran PDF 10 MB. Pengguna dapat melihat status dan catatan verifikasi. |
| Verifikasi SPJ | Admin dapat menyetujui SPJ (ACC) atau meminta revisi dengan catatan. Jika data perjalanan dinas berubah setelah SPJ dikirim, SPJ lama perlu diganti dengan PDF terbaru sebelum dapat diverifikasi. |
| Data pendukung dan pemantauan | Mengelola pegawai, pagu, pengaturan pejabat, akun pengguna, melihat analitik perjalanan dinas, dan log aktivitas. |

Sebagian dokumen dapat dicetak melalui halaman cetak tersendiri. Alur ini membantu pekerjaan administrasi, tetapi tidak berarti semua tahap selain ketergantungan RAB pada KAK dikunci secara otomatis.

## Peran pengguna

- **Pengguna yang sudah masuk** dapat mengakses halaman dan API aplikasi sesuai kontrol akses yang diterapkan.
- **Admin** memiliki akses tambahan untuk memverifikasi SPJ, mengelola pengguna, serta melihat log aktivitas.

Login menggunakan tabel `users` pada database. Pengguna dibuat atau dikelola melalui aplikasi; jangan mengasumsikan ada akun bawaan tertentu.

## Teknologi

- Node.js dan Express
- MySQL melalui `mysql2`
- Halaman antarmuka HTML, CSS, dan JavaScript di folder `public/`
- Session login yang disimpan di MySQL
- Cloudinary untuk penyimpanan PDF SPJ dan foto laporan

## Menjalankan aplikasi secara lokal

### Prasyarat

- Node.js dan npm
- MySQL yang berjalan secara lokal
- Kredensial Cloudinary untuk fitur upload dokumen dan foto

### Persiapan

1. Pasang dependensi:

   ```sh
   npm install
   ```

2. Siapkan database MySQL. Konfigurasi lokal pada `config/db.js` secara default menggunakan host `localhost`, user `root`, password kosong, dan database `kpu_db`. Sesuaikan konfigurasi tersebut jika lingkungan lokal berbeda.

3. Siapkan tabel database dari skema yang sesuai dengan versi aplikasi ini.

   > **Perhatian:** Repository memiliki beberapa dump SQL dengan struktur yang berbeda. Kode saat ini menggunakan relasi `dokumen_spj.perjadin_id`, sedangkan dump lama seperti `import.sql` dan `aiven.sql` menggunakan nama kolom berbeda. Jangan mengimpor dump ke database berisi data penting sebelum memeriksa dan mencocokkan skemanya.

4. Buat file `.env` di root project untuk konfigurasi rahasia dan layanan eksternal. Jangan commit file ini.

   ```dotenv
   # Opsional untuk menjalankan aplikasi secara lokal pada port selain 3300
   PORT=3300
   SESSION_SECRET=ganti-dengan-secret-acak-yang-kuat

   # Isi DB_HOST untuk menggunakan konfigurasi database berbasis environment
   DB_HOST=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   DB_PORT=
   DB_SSL_CA=

   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

   Jika `DB_HOST` tidak diisi, aplikasi menggunakan konfigurasi database lokal di `config/db.js`. Untuk database cloud, isi variabel `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, dan nilai port sesuai penyedia database. `DB_SSL_CA` digunakan bila diperlukan konfigurasi CA SSL.

5. Jalankan server:

   ```sh
   npm start
   ```

   Untuk pengembangan dengan restart otomatis:

   ```sh
   npm run dev
   ```

6. Buka `http://localhost:3300`. Halaman aplikasi selain halaman login memerlukan sesi pengguna yang valid.

## Konfigurasi penting

| Variabel | Kegunaan |
| --- | --- |
| `PORT` | Port server; default `3300`. |
| `SESSION_SECRET` | Secret untuk session login. Atur nilai acak yang kuat, terutama di deployment. |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Koneksi MySQL berbasis environment. Jika `DB_HOST` tidak tersedia, konfigurasi lokal di `config/db.js` yang digunakan. |
| `DB_SSL_CA` | CA certificate untuk koneksi database cloud yang membutuhkannya. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Kredensial penyimpanan file upload di Cloudinary. |
| `NODE_ENV` | Jika bernilai `production`, cookie session ditandai `secure` dan perlu diakses melalui HTTPS. |

Jangan menaruh password, token, atau kredensial layanan ke README, source code, atau commit.

## Struktur repository

```text
config/        Konfigurasi database
controllers/   Logika endpoint aplikasi
middleware/    Autentikasi dan pemrosesan upload
models/        Query dan akses data
public/        Halaman HTML, JavaScript, CSS, dan aset antarmuka
routes/        Definisi endpoint API
alter-table/   Dump dan skrip SQL untuk skema database
```

## Status pengujian

Belum ada test suite otomatis yang dikonfigurasi: script `npm test` saat ini masih berupa placeholder. Perubahan aplikasi sebaiknya diuji pada database pengembangan yang skemanya sudah dicocokkan, termasuk alur login, pengelolaan dokumen, cetak, upload, dan verifikasi.

## Catatan pengembangan dan pelacakan

README ini mencatat kemampuan yang terlihat pada halaman, route, dan controller aplikasi. Perbarui tabel **Alur dan kemampuan aplikasi** ketika fitur baru ditambahkan, diubah, atau tidak lagi tersedia. Catat pula batasan dan perubahan skema yang berdampak pada instalasi atau alur kerja.
