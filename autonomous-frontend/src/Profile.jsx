import React, { useState } from "react";
import { MdSecurity, MdCheckCircle, MdOutlineShield } from "react-icons/md";
import { useAuth } from "./AuthContext";
import { authAPI } from "./api";

export default function Profile() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleEnable2FA = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authAPI.enable2FA();
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Failed to generate 2FA." });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await authAPI.confirm2FA(otpCode);
      setMessage({ type: "success", text: "Two-Factor Authentication is now actively protecting your account." });
      setQrCode(null);
      // Ideally, the user object from context should refresh here
      // For now, prompt them
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Invalid code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
      <div className="page-header">
        <h2><MdOutlineShield style={{ verticalAlign: "middle", marginRight: 8, color: "var(--neon-green)" }} /> Security & Profile</h2>
        <p>Manage your operator identity and cryptographic defenses.</p>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <h3>Operator Identity</h3>
        </div>
        <table className="data-table">
          <tbody>
            <tr>
              <td style={{ width: 200, color: "var(--text-muted)" }}>Operator ID</td>
              <td style={{ fontWeight: "bold", color: "var(--neon-cyan)" }}>{user?.username}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)" }}>Registered Email</td>
              <td>{user?.email}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)" }}>Clearance Level</td>
              <td>
                <span className="badge" style={{ background: "rgba(0,240,255,0.1)", color: "var(--neon-cyan)" }}>
                  {user?.tier?.replace("_", " ").toUpperCase() || "FREE TRIAL"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ background: "rgba(10,15,20,0.8)", border: "1px solid rgba(57, 255, 20, 0.3)" }}>
        <div className="panel-header" style={{ borderBottomColor: "rgba(57,255,20,0.2)" }}>
          <h3 style={{ color: "var(--neon-green)", display: "flex", alignItems: "center", gap: 8 }}>
            <MdSecurity /> Two-Step Verification (TOTP)
          </h3>
        </div>

        {message && (
          <div style={{
            padding: 16, borderRadius: 8, marginBottom: 16,
            background: message.type === "error" ? "rgba(255,0,64,0.1)" : "rgba(57,255,20,0.1)",
            color: message.type === "error" ? "#ff0040" : "var(--neon-green)",
            border: `1px solid ${message.type === "error" ? "#ff0040" : "var(--neon-green)"}`
          }}>
            {message.text}
          </div>
        )}

        {user?.totp_enabled ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 0" }}>
            <MdCheckCircle size={48} color="var(--neon-green)" />
            <div>
              <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "1.2rem" }}>Account Secured</h4>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                Your account is protected by an industry-standard Time-based One-Time Password algorithm.
                Any new login attempts will require a code from your authenticator app.
              </p>
            </div>
          </div>
        ) : !qrCode ? (
          <div style={{ padding: "24px 0" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Two-Step Verification adds an extra layer of security to your Command Center. 
              Once configured, you'll be required to enter both your password and an authentication code from your mobile device to sign in.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={handleEnable2FA}
              disabled={loading}
              style={{ background: "var(--neon-green)", color: "#000", fontWeight: "bold" }}
            >
              {loading ? "INITIALIZING..." : "ENABLE 2-STEP VERIFICATION"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 32, padding: "24px 0", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <h4 style={{ color: "#fff", marginBottom: 16 }}>1. Scan the QR Code</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Open Google Authenticator, Authy, or Microsoft Authenticator on your mobile device and scan this cryptographic matrix.
              </p>
              <div style={{ background: "#fff", padding: 16, display: "inline-block", borderRadius: 8, marginTop: 16 }}>
                <img src={qrCode} alt="TOTP QR Code" style={{ width: 200, height: 200 }} />
              </div>
              <p style={{ marginTop: 16, fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                Manual Entry Secret:<br/>
                <span style={{ color: "var(--neon-cyan)" }}>{secret}</span>
              </p>
            </div>
            
            <div style={{ flex: 1, minWidth: 250 }}>
              <h4 style={{ color: "#fff", marginBottom: 16 }}>2. Verify & Activate</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 24 }}>
                Enter the 6-digit verification code generated by your app to permanently lock your security settings.
              </p>
              <form onSubmit={handleConfirm2FA}>
                <input
                  className="input"
                  type="text"
                  placeholder="000 000"
                  maxLength="6"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{ width: "100%", fontSize: "2rem", textAlign: "center", letterSpacing: "8px", fontFamily: "monospace", marginBottom: 24 }}
                />
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  style={{ width: "100%", background: "var(--neon-green)", color: "#000" }}
                >
                  {loading ? "VERIFYING..." : "ACTIVATE DEFENSES"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
