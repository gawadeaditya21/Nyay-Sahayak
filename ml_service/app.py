from flask import Flask, request, jsonify
from PIL import Image
import pytesseract
import io

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)

@app.route('/extract-text', methods=['POST'])
def extract_text():
    # Check if a file was sent in the request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    
    try:
        # Read the image file directly from the incoming stream
        img = Image.open(io.BytesIO(file.read()))
        
        # Extract text using Tesseract
        extracted_text = pytesseract.image_to_string(img)
        
        return jsonify({'success': True, 'text': extracted_text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Running on port 5001 so it doesn't clash with Node
    app.run(port=5001, debug=True)