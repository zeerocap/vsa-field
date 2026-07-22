import { Component } from "react";
import C from "../constants/theme.js";

// App-wide safety net. A render-time throw in any page used to white-page the
// whole PWA (blank #root, no recovery) — the same gap the sibling HRMS app had.
// This catches it and shows a recover-able fallback instead.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface it in the console for debugging; no external logger wired up yet.
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  handleReload = () => {
    // Clear the error and hard-reload so the app re-mounts from a clean state.
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 24,
          textAlign: "center",
          background: C.bg,
          fontFamily: "inherit",
        }}
      >
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: C.muted, maxWidth: 320, lineHeight: 1.5 }}>
          The app hit an unexpected error. Reloading usually fixes it. If it keeps happening, let
          the office know.
        </div>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: 4,
            background: C.brand,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
