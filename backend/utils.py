import hashlib

def generate_hash(file):
    file_bytes = file.read()
    return hashlib.sha256(file_bytes).hexdigest()