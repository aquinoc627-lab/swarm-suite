import React from "react";

/**
 * ErrorBoundary — catches unhandled rendering errors anywhere in the
 * component tree and displays a fallback UI instead of crashing the app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "var(--bg-primary, #0a0a0f)",
            color: "var(--neon-cyan, #00f0ff)",
            gap: "16px",
            padding: 32,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h2>
          <p style={{ color: "var(--text-muted, #888)", maxWidth: 480 }}>
            An unexpected error occurred. Please refresh the page or contact
            support if the problem persists.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
