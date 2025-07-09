const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('./'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(2500, () => {
    console.log('Kairos Studio running on port 2500');
});
