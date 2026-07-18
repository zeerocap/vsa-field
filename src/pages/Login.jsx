import { useState } from "react";
import { useNavigate } from "react-router-dom";
import C from "../constants/theme.js";
import { loginApi } from "../api/field.api.js";
import { setAuth } from "../utils/auth.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #7e1749 0%, #4a0d2b 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            border: "1px solid rgba(255,255,255,0.25)",
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 2C11.37 2 6 7.37 6 14c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z"
                fill="#fff" fillOpacity="0.95"/>
              <circle cx="18" cy="14" r="4.5" fill="#7e1749"/>
            </svg>
          </div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 26, letterSpacing: 1 }}>
            VSA FIELD
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
            Field Marketing Platform
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: C.text }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              background: C.dangerBg, color: C.danger,
              borderRadius: 10, padding: "10px 14px",
              marginBottom: 20, fontSize: 13, fontWeight: 500,
              border: `1px solid ${C.danger}30`,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Username */}
            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: C.muted, marginBottom: 6, letterSpacing: 0.5,
                textTransform: "uppercase",
              }}>
                Username
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: `1.5px solid ${C.border}`, borderRadius: 10,
                  padding: "11px 14px", fontSize: 14, color: C.text,
                  outline: "none", background: "#fff",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = C.brand}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: C.muted, marginBottom: 6, letterSpacing: 0.5,
                textTransform: "uppercase",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: `1.5px solid ${C.border}`, borderRadius: 10,
                    padding: "11px 42px 11px 14px", fontSize: 14, color: C.text,
                    outline: "none", background: "#fff",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = C.brand}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: C.muted, padding: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? C.muted : C.brand,
                color: "#ffffff",
                border: "none", borderRadius: 10,
                padding: "13px",
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 6,
                letterSpacing: 0.3,
                fontFamily: "inherit",
                boxShadow: loading ? "none" : "0 4px 12px rgba(126,23,73,0.4)",
                transition: "opacity 0.15s",
                opacity: loading ? 0.8 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                  </path>
                </svg>
              )}
              <span style={{ color: "#ffffff" }}>{loading ? "Signing in…" : "Sign In"}</span>
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          Vision Skill Academy · Field Marketing
        </div>
      </div>
    </div>
  );
}
