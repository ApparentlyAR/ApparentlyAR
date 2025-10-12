const express = require('express');
const cors = require('cors');
const path = require('path');
const DataProcessor = require('./dataProcessor');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// frontend AppApi.processData() will sent here
app.post('/api/process-data', async (req, res) => {
  try {
    const { data = [], operations = [] } = req.body || {};
    const out = await DataProcessor.processData(data, operations);
    res.json({ success: true, data: out });
  } catch (err) {
    console.error('process-data error:', err);
    res.status(400).json({ success: false, error: err.message || 'Processing failed' });
  }
});

// server public/ static（our HTML/CSS/JS）
app.use(express.static(path.join(__dirname, '../../public')));

// default enerty page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/view-project.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
