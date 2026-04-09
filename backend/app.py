from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
from dotenv import load_dotenv
import os
import json
from utils import hash_file, hash_to_bytes32, generate_qr_code, timestamp_to_date

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Connect to blockchain ────────────────────────────────
w3 = Web3(Web3.HTTPProvider(os.getenv("RPC_URL")))

# ── Load contract ────────────────────────────────────────
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ACCOUNT = w3.eth.account.from_key(PRIVATE_KEY)

with open("contract_abi.json") as f:
    ABI = json.load(f)

contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=ABI
)

# ── Routes ───────────────────────────────────────────────

@app.route("/")
def home():
    connected = w3.is_connected()
    print(f"Blockchain connected: {connected}")
    return jsonify({"status": "Backend running!", "connected": connected})

@app.route("/issue", methods=["POST"])
def issue_document():
    try:
        file = request.files["file"]
        doc_id = request.form["docId"]
        issuer_name = request.form["issuerName"]
        owner_name = request.form["ownerName"]
        doc_type = request.form["docType"]

        # Hash the file
        file_bytes = file.read()
        hex_hash = hash_file(file_bytes)
        doc_hash = hash_to_bytes32(hex_hash)

        # Send transaction to blockchain
        txn = contract.functions.issueDocument(
            doc_hash,
            doc_id,
            issuer_name,
            owner_name,
            doc_type
        ).build_transaction({
            "from": ACCOUNT.address,
            "nonce": w3.eth.get_transaction_count(ACCOUNT.address),
            "gas": 300000,
            "gasPrice": w3.to_wei("10", "gwei")
        })

        signed = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        # Generate QR code
        qr_data = f"VERIFY:{hex_hash}"
        qr_code = generate_qr_code(qr_data)

        return jsonify({
            "success": True,
            "docHash": hex_hash,
            "txHash": tx_hash.hex(),
            "qrCode": qr_code
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/verify", methods=["POST"])
def verify_document():
    try:
        file = request.files["file"]
        file_bytes = file.read()
        hex_hash = hash_file(file_bytes)
        doc_hash = hash_to_bytes32(hex_hash)

        result = contract.functions.verifyDocument(doc_hash).call()

        exists     = result[0]
        is_revoked = result[1]
        doc_id     = result[2]
        issuer     = result[3]
        owner      = result[4]
        doc_type   = result[5]
        issued_at  = result[6]

        if not exists:
            return jsonify({
                "success": True,
                "verified": False,
                "message": "Document not found on blockchain"
            })

        return jsonify({
            "success": True,
            "verified": True,
            "isRevoked": is_revoked,
            "docId": doc_id,
            "issuerName": issuer,
            "ownerName": owner,
            "docType": doc_type,
            "issuedAt": timestamp_to_date(issued_at)
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/revoke", methods=["POST"])
def revoke_document():
    try:
        data = request.json
        hex_hash = data["docHash"]
        doc_hash = hash_to_bytes32(hex_hash)

        txn = contract.functions.revokeDocument(doc_hash).build_transaction({
            "from": ACCOUNT.address,
            "nonce": w3.eth.get_transaction_count(ACCOUNT.address),
            "gas": 200000,
            "gasPrice": w3.to_wei("10", "gwei")
        })

        signed = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        w3.eth.wait_for_transaction_receipt(tx_hash)

        return jsonify({"success": True, "txHash": tx_hash.hex()})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)