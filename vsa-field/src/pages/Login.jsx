import { useState } from "react";
import { useNavigate } from "react-router-dom";
import C from "../constants/theme.js";
import { loginApi } from "../api/field.api.js";
import { setAuth } from "../utils/auth.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true); setError(null);
    try {
      const res = await loginApi(username, password);
      if (!res.token) throw new Error(res.error || "Login failed");
      setAuth(res.token, res.user || { username, role: res.role });
      nav("/", { replace: true });
    } catch (err) { setError(err.message || "Login failed"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.sidebar, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
          <div style={{ color: C.accent, fontWeight: 800, fontSize: 26, letterSpacing: 1 }}>VSA FIELD</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 4 }}>Field Marketing Platform</div>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 28, border: "1px solid rgba(255,255,255,0.1)" }}>
          {error && <div style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>USERNAME</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username"
                style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Enter password" autoComplete="current-password"
                style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", background: C.accent, color: C.primary, border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
