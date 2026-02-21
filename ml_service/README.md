# Nyay Sahayak - ML Service 🧠⚖️

This repository contains the Machine Learning and AI backend for **Nyay Sahayak**, an AI-powered legal document screening assistant. It acts as an isolated microservice built with Python and Flask, communicating with the main Node.js backend.

## 🌟 Core Features

* **OCR Engine:** Extracts raw text from uploaded legal document images using Tesseract.
* **AI Analysis (Planned):** Integrates with the Google Gemini API to analyze clauses, identify risks, and translate complex legal jargon into simple language.
* **RAG Pipeline (Planned):** Utilizes LegalBERT embeddings and FAISS to match user document clauses against Indian legal datasets (e.g., IndicLegalQA).

## 📁 Directory Structure
```text
ml_service/
├── app.py               # Main Flask API entry point
├── requirements.txt     # Python dependencies
├── .env                 # API Keys (Gemini, etc.) - DO NOT COMMIT
├── .gitignore           # Ignores venv, cache, and heavy ML models
├── core/                # Core AI business logic (OCR, Gemini Prompts, BERT)
└── data/                # Vector databases (FAISS) and raw JSON datasets
```

## 🛠️ Prerequisites

Before running this service, you must install the Tesseract OCR engine on your system:

- Windows: Download the installer from UB Mannheim (Usually installs to C:\Program Files\Tesseract-OCR).
- Mac: brew install tesseract
- Linux: sudo apt install tesseract-ocr

## 🚀 Setup Instructions

1. Navigate to the directory
```bash
cd ml_service
```

2. Create and activate a Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install Dependencies
```bash
pip install Flask Pillow pytesseract
# Future: pip install transformers torch faiss-cpu google-generativeai
```

4. Configure Tesseract Path (Windows Only)
Ensure your app.py has the correct path to the Tesseract executable:
```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

💻 Running the Server
Start the Flask development server (runs on Port 5001 by default to avoid clashing with the Node server):

```bash
python app.py
```

📡 API Endpoints
POST /extract-text
Accepts an image file and returns the extracted OCR text.

Request Type: multipart/form-data

Body: file (Image/PDF)

Response:
```json
{
  "success": true,
  "text": "Extracted legal document text goes here..."
}
```
