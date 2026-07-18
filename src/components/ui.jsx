import { useState, useEffect, useContext, createContext, useCallback } from "react";
import C from "../constants/theme.js";
import Icon from "./Icons.jsx";

// ── Toast Context ──────────────────────────────────────────────────────────
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const COLORS = {
    success: { bg: C.success,  icon: "check-circle" },
    error:   { bg: C.danger,   icon: "x-circle" },
    info:    { bg: C.info,     icon: "info" },
    warning: { bg: C.warning,  icon: "alert-triangle" },
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} style={{
              background: c.bg, color: "#fff", borderRadius: 10,
              padding: "10px 14px", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              maxWidth: 320, pointerEvents: "auto",
              animation: "toastIn 0.25s ease",
            }}>
              <Icon name={c.icon} size={16} color="#fff" />
              {t.msg}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return (msg, type) => console.log(`[toast/${type}]`, msg);
  return ctx;
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

// ── Btn ────────────────────────────────────────────────────────────────────
const BTN_STYLES = {
  primary:   { bg: C.brand,   color: "#fff", shadow: "0 2px 8px rgba(126,23,73,0.25)" },
  secondary: { bg: "#F3F4F6", color: C.text, shadow: "none" },
  danger:    { bg: C.danger,  color: "#fff", shadow: "0 2px 6px rgba(220,38,38,0.25)" },
  ghost:     { bg: "transparent", color: C.brand, shadow: "none" },
  success:   { bg: C.success, color: "#fff", shadow: "0 2px 8px rgba(22,163,74,0.25)" },
};

export function Btn({ children, onClick, variant = "primary", size, disabled, style = {}, type = "button" }) {
  const s   = BTN_STYLES[variant] || BTN_STYLES.primary;
  const pad = size === "lg" ? "13px 24px" : size === "sm" ? "6px 12px" : "9px 18px";
  const fs  = size === "lg" ? 15 : size === "sm" ? 12 : 13;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ background: s.bg, color: s.color, border: "none", borderRadius: 9,
        padding: pad, fontSize: fs, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1, boxShadow: s.shadow, transition: "opacity 0.15s, transform 0.1s",
        letterSpacing: 0.2, ...style }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={e   => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, color = C.brand, bg = C.brandBg }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, display: "inline-block", letterSpacing: 0.2 }}>
      {children}
    </span>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = "text", required, style = {}, min, max }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted,
        marginBottom: 5, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</label>}
      <input value={value} onChange={onChange} placeholder={placeholder}
        type={type} required={required} min={min} max={max}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: "100%", border: `1.5px solid ${focus ? C.brand : C.border}`, borderRadius: 9,
          padding: "11px 13px", fontSize: 14, color: C.text, outline: "none",
          background: "#fff", boxSizing: "border-box", transition: "border-color 0.15s",
          fontFamily: "inherit", ...style }} />
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options = [], required, style = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={style}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted,
        marginBottom: 5, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</label>}
      <select value={value} onChange={onChange} required={required}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: "100%", border: `1.5px solid ${focus ? C.brand : C.border}`, borderRadius: 9,
          padding: "11px 13px", fontSize: 14, color: C.text, outline: "none",
          background: "#fff", boxSizing: "border-box", cursor: "pointer",
          transition: "border-color 0.15s", appearance: "none",
          backgroundImage: "url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")",
          backgroundRepeat: "no-repeat", backgroundPosition: "right 13px center",
          paddingRight: 36 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder, rows = 3, style = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted,
        marginBottom: 5, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: "100%", border: `1.5px solid ${focus ? C.brand : C.border}`, borderRadius: 9,
          padding: "11px 13px", fontSize: 14, color: C.text, outline: "none", resize: "vertical",
          background: "#fff", boxSizing: "border-box", transition: "border-color 0.15s",
          fontFamily: "inherit", ...style }} />
    </div>
  );
}

// ── FormError ──────────────────────────────────────────────────────────────
export function FormError({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ background: C.dangerBg, color: C.danger, borderRadius: 9,
      padding: "10px 14px", fontSize: 13, fontWeight: 500, border: `1px solid ${C.danger}30`,
      display: "flex", alignItems: "center", gap: 8 }}>
      <Icon name="x-circle" size={15} color={C.danger} />
      {msg}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
        background: C.card, borderRadius: "20px 20px 0 0",
        padding: "0 20px 36px", maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        animation: "slideUp 0.25s ease" }}>
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 0 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>{title}</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%",
            background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 16 }}>×</div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── BottomSheet (alias for More menu) ──────────────────────────────────────
export function BottomSheet({ open, onClose, title, children }) {
  return <Modal open={open} onClose={onClose} title={title}>{children}</Modal>;
}

// ── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, sub, color, bg }) {
  return (
    <Card style={{ padding: "16px", background: bg || C.card }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4,
            textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: color || C.text, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: (color || C.brand) + "18",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={icon} size={18} color={color || C.brand} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = 32, color = C.brand }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48 }}>
      <div style={{ width: size, height: size, border: `3px solid ${C.border}`,
        borderTopColor: color, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );
}

// ── PageSpinner ────────────────────────────────────────────────────────────
export function PageSpinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: 14 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`,
        borderTopColor: C.brand, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading…</div>
    </div>
  );
}

// ── Empty ──────────────────────────────────────────────────────────────────
export function Empty({ msg = "Nothing here yet", icon = "inbox", action, actionLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px", color: C.muted }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ width: 64, height: 64, background: C.bg, borderRadius: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${C.border}` }}>
          <Icon name={icon} size={28} color="#D1D5DB" />
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>{msg}</div>
      {action && (
        <Btn onClick={action} variant="primary" size="sm" style={{ marginTop: 12 }}>
          {actionLabel || "Get started"}
        </Btn>
      )}
    </div>
  );
}

// ── ProgressBar ────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color, showLabel = true, height = 8 }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const c = color || (pct >= 100 ? C.success : pct >= 60 ? C.brand : C.warning);
  return (
    <div>
      <div style={{ background: C.border, borderRadius: 99, height, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: c, height: "100%", borderRadius: 99,
          transition: "width 0.6s ease" }} />
      </div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4,
          fontSize: 11, color: C.muted }}>
          <span>{value} / {max}</span>
          <span style={{ fontWeight: 700, color: c }}>{pct}%</span>
        </div>
      )}
    </div>
  );
}
