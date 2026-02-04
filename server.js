require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const perjadinRoutes = require('./routes/perjadinRoutes');
const pegawaiRoutes = require('./routes/pegawaiRoutes');
const sppdRoutes = require('./routes/sppdRoutes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/perjadin', perjadinRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/sppd', sppdRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server nyala di http://localhost:${PORT}`);
});

// Endpoint untuk mengambil data pegawai berdasarkan kategori (PNS/PPPK/Komisioner)
