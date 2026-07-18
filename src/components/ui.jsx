import { useState, useEffect } from "react";
import C from "../constants/theme.js";
import Icon from "./Icons.jsx";

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        boxShadow: C.shadow, ...style }}>
      {children}
    </div>
  );
}

// ── Btn ──────────────────────────────────────────────────────────────────────
const BTN_STYLES = {
  primary:   { bg: C.brand,       color: "#fff",   shadow: "0 2px 8px rgba(126,23,73,0.25)" },
  secondary: { bg: "#F3F4F6",     color: C.text,   shadow: "none" },
  danger:    { bg: C.danger,      color: "#fff",   shadow: "0 2px 6px rgba(220,38,38,0.25)" },
  ghost:     { bg: "transparent", color: C.brand,  shadow: "none" },
  accent:    { bg: C.brand,       color: "#fff",   shadow: "0 2px 8px rgba(126,23,73,0.25)" },
};

export function Btn({ children, onClick, variant = "primary", size, disabled, style = {}, type = "button" }) {
  const s = BTN_STYLES[variant] || BTN_STYLES.primary;
  const pad = size === "lg" ? "12px 22px" : size === "sm" ? "6px 12px" : "9px 18px";
  const fs  = size === "lg" ? 15 : size === "sm" ? 12 : 13;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ background: s.bg, color: s.color, border: "none", borderRadius: 8,
        padding: pad, fontSize: fs, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1, boxShadow: s.shadow, transition: "opacity 0.15s", ...style }}>
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = C.brand, bg = C.brandBg }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, display: "inline-block" }}>
      {children}
    </span>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = "text", required, style = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text,
        marginBottom: 5, letterSpacing: 0.2 }}>{label}</label>}
      <input value={value} onChange={onChange} placeholder={placeholder} type={type} required={required}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: "100%", border: `1.5px solid ${focus ? C.brand : C.border}`, borderRadius: 8,
          padding: "10px 12px", fontSize: 14, color: C.text, outline: "none",
          background: "#fff", boxSizing: "border-box", transition: "border-color 0.15s", ...style }} />
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options = [], required, style = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={style}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text,
        marginBottom: 5, letterSpacing: 0.2 }}>{label}</label>}
      <select value={value} onChange={onChange} required={required}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: "100%", border: `1.5px solid ${focus ? C.brand : C.border}`, borderRadius: 8,
          padding: "10px 12px", fontSize: 14, color: C.text, outline: "none",
          background: "#fff", boxSizing: "border-box", cursor: "pointer", transition: "border-color 0.15s" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
        background: C.card, borderRadius: "20px 20px 0 0",
        padding: "20px 20px 36px", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text }}>{title}</div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%",
            background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 18, color: C.muted, lineHeight: 1 }}>×</div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
// icon prop can be an Icon name string or a React element
export function StatCard({ label, value, icon, sub, color, bg }) {
  return (
    <Card style={{ padding: "16px", background: bg || C.card }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 4,
            textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: color || C.text, lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: (color || C.brand) + "18",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={icon} size={16} color={color || C.brand} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`,
        borderTopColor: C.brand, borderRadius: "50%",
        animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Empty ────────────────────────────────────────────────────────────────────
export function Empty({ msg = "Nothing here yet", icon = "inbox" }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <Icon name={icon} size={40} color="#D1D5DB" />
      </div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  );
}
