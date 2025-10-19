const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
});