from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import subprocess
import os
import uuid

app = Flask(__name__, static_folder='../frontend', static_url_path='/')
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

STEGO_EXEC = os.path.join(BASE_DIR, 'stego.exe' if os.name == 'nt' else 'stego')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/encode', methods=['POST'])
def encode():
    if 'image' not in request.files or 'message' not in request.form:
        return jsonify({"error": "Missing image or message"}), 400
    
    img_file = request.files['image']
    message = request.form['message']
    
    if img_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    input_filename = f"{uuid.uuid4()}_in.png"
    output_filename = f"{uuid.uuid4()}_out.png"
    
    in_path = os.path.join(app.config['UPLOAD_FOLDER'], input_filename)
    out_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
    
    img_file.save(in_path)
    
    try:
        result = subprocess.run([STEGO_EXEC, 'encode', in_path, message, out_path], capture_output=True, text=True)
        
        if result.returncode != 0 or "Error" in result.stdout or "Exception" in result.stderr:
            err_msg = result.stderr if result.stderr else result.stdout
            return jsonify({"error": f"Encoding failed: {err_msg}"}), 500
            
        return send_file(out_path, as_attachment=True, download_name="stego_image.png")
    finally:
        if os.path.exists(in_path):
            os.remove(in_path)

@app.route('/decode', methods=['POST'])
def decode():
    if 'image' not in request.files:
        return jsonify({"error": "Missing image"}), 400
        
    img_file = request.files['image']
    
    ext = os.path.splitext(img_file.filename)[1]
    if not ext:
        ext = '.png'
        
    in_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{uuid.uuid4()}_decode{ext}")
    img_file.save(in_path)
    
    try:
        result = subprocess.run([STEGO_EXEC, 'decode', in_path], capture_output=True, text=True)
        if result.returncode != 0 or "Error" in result.stdout or "Exception" in result.stderr:
            err_msg = result.stderr if result.stderr else result.stdout
            return jsonify({"error": f"Decoding failed: {err_msg}"}), 500
            
        message = result.stdout.strip()
        return jsonify({"message": message})
    finally:
        if os.path.exists(in_path):
            os.remove(in_path)

if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
