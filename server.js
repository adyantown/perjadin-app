const express = require('express');
const path = require('path');
const app = express();
const perjadinRoutes = require('./routes/perjadinRoutes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', perjadinRoutes);
app.listen(3000, () => console.log('Aplikasi Perjadin (MySQL) on port 3000'));
