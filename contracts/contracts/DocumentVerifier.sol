// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentVerifier {
    struct Document {
        string  docId;
        string  issuerName;
        string  ownerName;
        string  docType;
        uint256 issuedAt;
        bool    isRevoked;
        address issuedBy;
    }

    mapping(bytes32 => Document) private documents;
    mapping(address => bool) public authorizedIssuers;
    address public admin;

    event DocumentIssued(bytes32 indexed docHash, string docId, string issuerName, string ownerName, uint256 issuedAt);
    event DocumentRevoked(bytes32 indexed docHash, address revokedBy);

    modifier onlyAdmin() { require(msg.sender == admin, "Not admin"); _; }
    modifier onlyIssuer() { require(authorizedIssuers[msg.sender], "Not authorized"); _; }

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function authorizeIssuer(address issuer) external onlyAdmin {
        authorizedIssuers[issuer] = true;
    }

    function issueDocument(
        bytes32 docHash,
        string memory docId,
        string memory issuerName,
        string memory ownerName,
        string memory docType
    ) external onlyIssuer {
        require(documents[docHash].issuedAt == 0, "Already registered");
        documents[docHash] = Document(docId, issuerName, ownerName, docType, block.timestamp, false, msg.sender);
        emit DocumentIssued(docHash, docId, issuerName, ownerName, block.timestamp);
    }

    function revokeDocument(bytes32 docHash) external {
        Document storage doc = documents[docHash];
        require(doc.issuedAt != 0, "Not found");
        require(msg.sender == doc.issuedBy || msg.sender == admin, "Not authorized");
        doc.isRevoked = true;
        emit DocumentRevoked(docHash, msg.sender);
    }

    function verifyDocument(bytes32 docHash) external view returns (
        bool exists, bool isRevoked, string memory docId,
        string memory issuerName, string memory ownerName,
        string memory docType, uint256 issuedAt
    ) {
        Document memory doc = documents[docHash];
        if (doc.issuedAt == 0) return (false, false, "", "", "", "", 0);
        return (true, doc.isRevoked, doc.docId, doc.issuerName, doc.ownerName, doc.docType, doc.issuedAt);
    }
}