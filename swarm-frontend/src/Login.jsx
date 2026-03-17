import React from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export default function Login() {
  const handleLogin = (provider) => {
    window.location.href = `${BACKEND}/api/auth/login/${provider}`;
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Swarm Suite</h1>
      <p className="login-subtitle">Sign in to continue</p>
      <div className="login-buttons">
        <button
          className="neon-btn neon-btn-google"
          onClick={() => handleLogin("google")}
        >
          Sign in with Google
        </button>
        <button
          className="neon-btn neon-btn-github"
          onClick={() => handleLogin("github")}
        >
          Sign in with GitHub
        </button>
        <button
          className="neon-btn neon-btn-microsoft"
          onClick={() => handleLogin("microsoft")}
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
