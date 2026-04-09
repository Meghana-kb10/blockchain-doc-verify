import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

const API = "http://127.0.0.1:5000";

// ── Animated background particles ────────────────────────
function Particles() {
  return (
    <div className="particles">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 6}s`,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
        }} />
      ))}
    </div>
  );
}

// ── Grid lines background ─────────────────────────────────
function GridBg() {
  return <div className="grid-bg" />;
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    axios.get(`${API}/`).then(r => setBackendStatus(r.data.connected)).catch(() => setBackendStatus(false));
  }, []);

  return (
    <div className="app">
      <GridBg />
      <Particles />

      {/* ── Navbar ── */}
      <nav>
        <div className="logo">
          <div className="logo-icon">⬡</div>
          <div>
            <span className="logo-text">DocVerify</span>
            <span className="logo-sub">BLOCKCHAIN</span>
          </div>
        </div>

        <div className="nav-links">
          {["home", "issue", "verify", "history"].map(p => (
            <button key={p} onClick={() => setPage(p)} className={page === p ? "active" : ""}>
              {p === "home" && "⌂ Home"}
              {p === "issue" && "＋ Issue"}
              {p === "verify" && "✓ Verify"}
              {p === "history" && "◷ History"}
            </button>
          ))}
        </div>

        <div className="status-pill">
          <div className={`status-dot ${backendStatus === true ? "online" : backendStatus === false ? "offline" : "checking"}`} />
          <span>{backendStatus === true ? "Chain Connected" : backendStatus === false ? "Disconnected" : "Connecting..."}</span>
        </div>
      </nav>

      {/* ── Pages ── */}
      <main>
        {page === "home"    && <Home setPage={setPage} />}
        {page === "issue"   && <Issue />}
        {page === "verify"  && <Verify />}
        {page === "history" && <History />}
      </main>

      <footer>
        <p>Powered by <span>Polygon Blockchain</span> · Sai Vidya Institute of Technology · Hackverse 2026</p>
      </footer>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────
function Home({ setPage }) {
  const stats = [
    { label: "Documents Secured", value: "100%" },
    { label: "Tamper Proof", value: "SHA-256" },
    { label: "Verification Time", value: "<1s" },
    { label: "Blockchain", value: "Polygon" },
  ];

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-badge">🔐 BLOCKCHAIN POWERED</div>
        <h1>Secure Document<br /><span className="gradient-text">Verification System</span></h1>
        <p>Issue, verify and manage digital documents on the blockchain. Tamper-proof, instant, and globally accessible.</p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => setPage("issue")}>＋ Issue Document</button>
          <button className="btn-outline" onClick={() => setPage("verify")}>✓ Verify Document</button>
        </div>
      </div>

      <div className="stats-row">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="features">
        <FeatureCard icon="⛓️" title="Immutable Records" desc="Once issued, documents are permanently recorded on the blockchain and cannot be altered or deleted." />
        <FeatureCard icon="⚡" title="Instant Verification" desc="Verify any document in under a second by uploading the file. No manual checks needed." />
        <FeatureCard icon="📱" title="QR Code Sharing" desc="Every issued document gets a unique QR code for easy sharing and one-tap verification." />
        <FeatureCard icon="🔒" title="SHA-256 Hashing" desc="Documents are hashed using military-grade SHA-256 encryption before being stored on-chain." />
        <FeatureCard icon="🌍" title="Decentralized" desc="No central authority controls the records. The blockchain ensures global trustless verification." />
        <FeatureCard icon="📋" title="Revocation Support" desc="Issuers can revoke documents at any time. Verifiers always see the latest status." />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

// ── Issue Page ────────────────────────────────────────────
function Issue() {
  const [form, setForm] = useState({ docId: "", issuerName: "", ownerName: "", docType: "" });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(1);
  const fileRef = useRef();

  const docTypes = ["Degree Certificate", "Mark Sheet", "ID Card", "Bonafide Certificate", "Experience Letter", "Birth Certificate", "Other"];

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !form.docId || !form.issuerName || !form.ownerName || !form.docType) {
      setError("Please fill all fields and select a file!"); return;
    }
    setLoading(true); setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      const res = await axios.post(`${API}/issue`, data);
      setResult(res.data);
      // Save to history
      const history = JSON.parse(localStorage.getItem("docHistory") || "[]");
      history.unshift({ ...res.data, ...form, fileName: file.name, type: "issued", date: new Date().toLocaleString() });
      localStorage.setItem("docHistory", JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      setError(e.response?.data?.error || "Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h2>＋ Issue Document</h2>
        <p>Register a document permanently on the blockchain</p>
      </div>

      {/* Steps indicator */}
      <div className="steps">
        {["Document Info", "Upload File", "Register"].map((s, i) => (
          <div key={i} className={`step ${step > i ? "done" : step === i + 1 ? "active" : ""}`}>
            <div className="step-num">{step > i ? "✓" : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="issue-grid">
        <div className="form-card">
          <h3>Document Details</h3>
          <div className="form">
            <div className="input-group">
              <label>Document ID</label>
              <input placeholder="e.g. DEGREE-2024-001" value={form.docId}
                onChange={e => { setForm({ ...form, docId: e.target.value }); setStep(2); }} />
            </div>
            <div className="input-group">
              <label>Issuer Name</label>
              <input placeholder="e.g. Sai Vidya Institute of Technology" value={form.issuerName}
                onChange={e => setForm({ ...form, issuerName: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Owner Name</label>
              <input placeholder="e.g. John Doe" value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Document Type</label>
              <select value={form.docType} onChange={e => setForm({ ...form, docType: e.target.value })}>
                <option value="">Select type...</option>
                {docTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Upload Document</h3>
          <div className={`dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current.click()}>
            <input type="file" ref={fileRef} style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); setStep(3); }} />
            {file ? (
              <>
                <div className="file-icon">📄</div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                <span className="change-file">Click to change</span>
              </>
            ) : (
              <>
                <div className="upload-icon">⬆</div>
                <p>Drag & drop your file here</p>
                <span>or click to browse</span>
                <p className="file-hint">PDF, JPG, PNG, DOC supported</p>
              </>
            )}
          </div>

          {error && <div className="error-msg">⚠ {error}</div>}

          <button className="btn-primary full" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="loading-text">
                <span className="spinner" /> Registering on Blockchain...
              </span>
            ) : "⛓ Register on Blockchain"}
          </button>
        </div>
      </div>

      {result?.success && (
        <div className="result-card success">
          <div className="result-header">
            <div className="success-badge">✓ VERIFIED ON CHAIN</div>
            <h3>Document Successfully Registered!</h3>
          </div>
          <div className="result-body">
            <div className="result-info">
              <div className="hash-box">
                <label>Document Hash (SHA-256)</label>
                <code>{result.docHash}</code>
              </div>
              <div className="hash-box">
                <label>Transaction Hash</label>
                <code>{result.txHash}</code>
              </div>
              <div className="meta-grid">
                <div><label>Doc ID</label><span>{form.docId}</span></div>
                <div><label>Owner</label><span>{form.ownerName}</span></div>
                <div><label>Issuer</label><span>{form.issuerName}</span></div>
                <div><label>Type</label><span>{form.docType}</span></div>
              </div>
            </div>
            <div className="qr-section">
              <label>QR Code for Verification</label>
              <img src={`data:image/png;base64,${result.qrCode}`} alt="QR Code" />
              <p>Share this QR to let anyone verify this document</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Verify Page ───────────────────────────────────────────
function Verify() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleVerify = async () => {
    if (!file) { setError("Please select a file!"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await axios.post(`${API}/verify`, data);
      setResult(res.data);
      // Save to history
      const history = JSON.parse(localStorage.getItem("docHistory") || "[]");
      history.unshift({ fileName: file.name, type: "verified", verified: res.data.verified, date: new Date().toLocaleString(), ...res.data });
      localStorage.setItem("docHistory", JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      setError(e.response?.data?.error || "Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h2>✓ Verify Document</h2>
        <p>Upload any document to instantly check if it's authentic on the blockchain</p>
      </div>

      <div className="verify-wrap">
        <div className="form-card verify-card">
          <div className="how-it-works">
            <h4>How it works</h4>
            <div className="steps-mini">
              <div className="step-mini"><span>1</span> Upload your document file</div>
              <div className="step-mini"><span>2</span> We hash it using SHA-256</div>
              <div className="step-mini"><span>3</span> Hash is checked on blockchain</div>
              <div className="step-mini"><span>4</span> Result shown instantly</div>
            </div>
          </div>

          <div className={`dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current.click()}>
            <input type="file" ref={fileRef} style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            {file ? (
              <>
                <div className="file-icon">📄</div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                <span className="change-file">Click to change</span>
              </>
            ) : (
              <>
                <div className="upload-icon">🔍</div>
                <p>Drop document to verify</p>
                <span>or click to browse</span>
              </>
            )}
          </div>

          {error && <div className="error-msg">⚠ {error}</div>}

          <button className="btn-primary full" onClick={handleVerify} disabled={loading}>
            {loading ? (
              <span className="loading-text"><span className="spinner" /> Checking Blockchain...</span>
            ) : "🔍 Verify on Blockchain"}
          </button>
        </div>

        {result && (
          <div className={`result-card ${result.verified ? result.isRevoked ? "revoked" : "success" : "fail"}`}>
            <div className="verify-result-icon">
              {result.verified ? result.isRevoked ? "⚠️" : "✅" : "❌"}
            </div>
            <h3>
              {result.verified
                ? result.isRevoked ? "Document Has Been Revoked" : "Document is Authentic!"
                : "Document Not Found on Blockchain"}
            </h3>

            {result.verified && (
              <div className="verify-details">
                <div className="detail-row"><label>Document ID</label><span>{result.docId}</span></div>
                <div className="detail-row"><label>Owner</label><span>{result.ownerName}</span></div>
                <div className="detail-row"><label>Issuer</label><span>{result.issuerName}</span></div>
                <div className="detail-row"><label>Type</label><span>{result.docType}</span></div>
                <div className="detail-row"><label>Issued At</label><span>{result.issuedAt}</span></div>
                <div className="detail-row">
                  <label>Status</label>
                  <span className={`status-tag ${result.isRevoked ? "revoked" : "valid"}`}>
                    {result.isRevoked ? "REVOKED" : "VALID"}
                  </span>
                </div>
              </div>
            )}

            {!result.verified && (
              <p className="not-found-msg">This document has not been registered on the blockchain or has been tampered with.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── History Page ──────────────────────────────────────────
function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("docHistory") || "[]"));
  }, []);

  const clear = () => { localStorage.removeItem("docHistory"); setHistory([]); };

  return (
    <div className="page-wrap">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>◷ Activity History</h2>
          <p>All your issued and verified documents this session</p>
        </div>
        {history.length > 0 && <button className="btn-outline small" onClick={clear}>Clear History</button>}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No activity yet</h3>
          <p>Issue or verify a document to see history here</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((h, i) => (
            <div key={i} className={`history-item ${h.type}`}>
              <div className="history-icon">{h.type === "issued" ? "📄" : h.verified ? "✅" : "❌"}</div>
              <div className="history-info">
                <div className="history-title">{h.fileName || h.docId || "Unknown"}</div>
                <div className="history-meta">
                  {h.type === "issued" ? `Issued · ${h.ownerName} · ${h.docType}` : `Verified · ${h.verified ? "Authentic" : "Not Found"}`}
                </div>
              </div>
              <div className="history-right">
                <span className={`history-badge ${h.type}`}>{h.type === "issued" ? "ISSUED" : h.verified ? "VALID" : "INVALID"}</span>
                <div className="history-date">{h.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}