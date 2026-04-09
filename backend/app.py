from flask import Flask, request, jsonify
from utils import generate_hash

app = Flask(__name__)

@app.route('/')
def home():
    return "Backend running 🚀"

# Upload + hash
@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    doc_hash = generate_hash(file)

    return jsonify({
        "message": "File uploaded successfully",
        "hash": doc_hash
    })

if __name__ == '__main__':
    app.run(debug=True)