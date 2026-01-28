require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const perjadinRoutes = require('./routes/perjadinRoutes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', perjadinRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server nyala di http://localhost:${PORT}`);
});
