// server.js (VERSI SECURE LOGIN)
require('dotenv').config();
const express = require('express');
const session = require('express-session'); // <--- PENTING
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs'); // <--- PENTING
const path = require('path');
const db = require('./config/db'); // Pastikan path ini benar

const app = express();

// 1. SETUP MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. SETUP SESSION (TIKET MASUK)
// --- PENTING BUAT VERCEL (Supaya Cookie HTTPS jalan) ---
app.set('trust proxy', 1);

// --- KONFIGURASI SESI DATABASE ---
const sessionStore = new MySQLStore(
    {
        // Opsi ini biarkan default, dia akan otomatis pakai koneksi dari 'db'
        expiration: 10800000, // Sesi berlaku 3 jam (opsional)
        createDatabaseTable: true, // Otomatis bikin tabel 'sessions' di DB
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
                data: 'data',
            },
        },
    },
    db,
); // <--- KITA MASUKKAN KONEKSI DATABASE KITA DI SINI

app.use(
    session({
        key: 'session_cookie_name',
        secret: process.env.SESSION_SECRET || 'rahasia_negara',
        store: sessionStore, // <--- GUNAKAN STORE MYSQL, JANGAN RAM LAGI
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true, // Wajib TRUE di Vercel (HTTPS)
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 Hari
        },
    }),
);

// 3. FUNGSI SATPAM (MIDDLEWARE CEK LOGIN)
// Fungsi ini akan mengecek: "Kamu punya tiket login gak?"
const cekLogin = (req, res, next) => {
    // List file yang boleh diakses TANPA Login
    const bebasAkses = ['/login.html', '/api/auth/login'];

    // Jika user mengakses file CSS/JS/Gambar, biarkan lewat
    if (req.path.startsWith('/style') || req.path.startsWith('/js') || req.path.startsWith('/img')) {
        return next();
    }

    // Jika user mengakses halaman bebas, biarkan lewat
    if (bebasAkses.includes(req.path)) {
        return next();
    }

    // Cek Tiket: Kalau ada session user_id, boleh masuk
    if (req.session.userId) {
        return next();
    }

    // Kalau tidak punya tiket, tendang ke login.html
    res.redirect('/login.html?alert=belum_login');
};

// Middleware Khusus Area Terlarang (Hanya Admin)
const hanyaAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        return next(); // Silakan lewat bos!
    }
    // Kalau bukan admin, tolak!
    res.status(403).json({ success: false, message: 'Akses Ditolak! Khusus Admin.' });
};

// --- ROUTES UNTUK AUTHENTICATION (LOGIN/LOGOUT) ---

// API Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // Cari user di database
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database Error' });

        // Cek username ada atau tidak
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Username tidak ditemukan!' });
        }

        const user = results[0];

        // Cek Password (bandingkan yg diketik vs database)
        // Note: Password database "admin123" (sudah di-hash)
        const isMatch = bcrypt.compareSync(password, user.password); // Kita pakai compareSync biar simpel buat logic ini

        // HACK SEMENTARA: Kalau mau test password polos "admin123" bisa pakai ini:
        // const isMatch = password === 'admin123';
        // TAPI KITA PAKAI YANG AMAN YAITU BCRYPT DI ATAS.

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password salah!' });
        }

        // Login Sukses! Berikan tiket sesi
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.nama = user.nama_lengkap;
        req.session.role = user.role;

        res.json({
            success: true,
            message: 'Login Berhasil!',
            user: { nama: user.nama_lengkap, role: user.role },
        });
    });
});

// API Logout
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); // Hapus cookie sesi
        res.redirect('/login.html');
    });
});

// API Cek Session (Dipakai Frontend untuk memastikan user masih login)
app.get('/api/auth/check', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, user: req.session.nama, role: req.session.role });
    } else {
        res.status(401).json({ loggedIn: false });
    }
});

// 4. PASANG SATPAM SEBELUM AKSES FILE PUBLIC
// Perintah ini membuat SEMUA file di folder public terlindungi "cekLogin"
// KECUALI yang sudah didefinisikan boleh lewat di fungsi cekLogin tadi.
app.use(cekLogin);
app.use(express.static(path.join(__dirname, 'public')));

// 5. ROUTES APLIKASI (Kodingan Lama Mas)
const perjadinRoutes = require('./routes/perjadinRoutes');
const pegawaiRoutes = require('./routes/pegawaiRoutes');
const sppdRoutes = require('./routes/sppdRoutes');
const settingRoutes = require('./routes/settingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dokumentasiRoutes = require('./routes/dokumentasiRoutes');

app.use('/api/perjadin', perjadinRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/sppd', sppdRoutes);
app.use('/api/settings', cekLogin, hanyaAdmin, settingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dokumentasi', dokumentasiRoutes);

// const PORT = process.env.PORT;
// app.listen(PORT, () => {
//     console.log(`Server nyala dengan AMAN di http://localhost:${PORT}`);
// });

const PORT = process.env.PORT || 3300;

// Cek: Apakah kita sedang di Vercel atau di Laptop?
if (require.main === module) {
    // Kalau di Laptop (dijalankan pakai 'node server.js'), kita butuh app.listen
    app.listen(PORT, () => {
        console.log(`Server nyala di http://localhost:${PORT}`);
    });
}

// PENTING BUAT VERCEL: Kita harus export 'app'
module.exports = app;
