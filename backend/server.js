const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());

// Use memory storage so we don't save to disk before forwarding
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Package the file buffer to send to Flask
        const formData = new FormData();
        formData.append('file', req.file.buffer, req.file.originalname);

        // Send to ML Service
        const flaskResponse = await axios.post('http://127.0.0.1:5001/extract-text', formData, {
            headers: { ...formData.getHeaders() }
        });

        // Send the extracted text back to the React frontend
        res.json({ 
            success: true, 
            extractedText: flaskResponse.data.text 
        });

    } catch (error) {
        console.error("Error communicating with ML Service:", error.message);
        res.status(500).json({ error: 'Failed to process document' });
    }
});

app.listen(5000, () => console.log('Node Backend running on port 5000'));