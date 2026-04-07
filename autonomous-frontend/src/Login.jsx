import React, { useState } from "react";
import { MdSecurity, MdRocketLaunch } from "react-icons/md";
import { useAuth } from "./AuthContext";
import { authAPI } from "./api";

export default function Login() {
  const { login, login2FA } = useAuth();
  
  const [mode, setMode] = useState("login"); // "login", "register", "2fa"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(username, password);
        if (res?.require2fa) {
          setMode("2fa");
          setLoading(false);
          return;
        }
      } else if (mode === "register") {
        await authAPI.register({ username, email, password });
        setMode("login");
        setError("Registration successful. Please login."); // Used as success message here
      } else if (mode === "2fa") {
        await login2FA(username, password, otpCode);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo192.png" alt="Autonomous" style={{ width: 64, height: 64, borderRadius: 12, filter: "drop-shadow(0 0 20px var(--neon-cyan))" }} />
          </div>
          <h1>Autonomous Nexus</h1>
          <p>
            {mode === "register" ? "Create your Operator Account" : mode === "2fa" ? "Two-Factor Verification Required" : "Authenticate to access Command Center"}
          </p>
        </div>

        {error && (
          <div className={`login-error ${error.includes('successful') ? 'success' : ''}`}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          
          {(mode === "login" || mode === "register") && (
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Operator ID"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              {mode === "register" && (
                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="secure@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === "2fa" && (
            <div className="form-group">
              <label>Authenticator Code (TOTP)</label>
              <input
                className="input"
                type="text"
                placeholder="000000"
                maxLength="6"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "4px" }}
              />
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", padding: "16px", marginTop: "16px" }}>
            {loading ? "PROCESSING..." : mode === "register" ? "REGISTER" : mode === "2fa" ? "VERIFY & LOGIN" : "AUTHORIZE"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
          {mode === "login" ? (
            <span>Don't have an account? <span style={{ color: "var(--neon-cyan)", cursor: "pointer" }} onClick={() => { setMode("register"); setError(null); }}>Register here</span></span>
          ) : mode === "register" ? (
            <span>Already have clearance? <span style={{ color: "var(--neon-cyan)", cursor: "pointer" }} onClick={() => { setMode("login"); setError(null); }}>Login</span></span>
          ) : (
            <span style={{ color: "var(--neon-cyan)", cursor: "pointer" }} onClick={() => setMode("login")}>Cancel Verification</span>
          )}
        </div>

      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020205 url('data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="1" fill="%2300f0ff" fill-opacity="0.1"/></svg>');
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(10, 10, 15, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 16px;
          padding: 40px;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .login-header h1 {
          font-size: 1.8rem;
          color: #fff;
          margin: 16px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .login-error {
          background: rgba(255, 0, 64, 0.1);
          border: 1px solid #ff0040;
          color: #ff0040;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: center;
          font-size: 0.9rem;
        }
        .login-error.success {
          background: rgba(57, 255, 20, 0.1);
          border-color: var(--neon-green);
          color: var(--neon-green);
        }
      `}</style>
    </div>
  );
}
