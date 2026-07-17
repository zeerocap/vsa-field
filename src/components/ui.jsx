import C from "../constants/theme.js";

export function Card({ children, style }) {
  return <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, boxShadow: C.shadow, ...style }}>{children}</div>;
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, style, type = "button" }) {
  const bg = variant === "primary" ? C.primary : variant === "accent" ? C.accent : variant === "danger" ? C.danger : variant === "ghost" ? "transparent" : "#F3F4F6";
  const color = variant === "ghost" ? C.muted : variant === "secondary" ? C.text : "#fff";
  const pad = size === "sm" ? "6px 14px" : size === "lg" ? "14px 28px" : "10px 20px";
  const fs = size === "sm" ? 13 : size === "lg" ? 16 : 14;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background: bg, color, border: variant === "ghost" ? `1px solid ${C.border}` : "none",
      borderRadius: 8, padding: pad, fontSize: fs, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "opacity .15s", ...style
    }}>{children}</button>
  );
}

export function Badge({ children, color = C.primary, bg }) {
  return <span style={{ background: bg || color + "18", color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{children}</span>;
}

export function Input({ label, value, onChange, type = "text", placeholder, required, disabled, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{label}{required && " *"}</label>}
      <input value={value} onChange={onChange} type={type} placeholder={placeholder} disabled={disabled} required={required}
        style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.text, background: disabled ? "#F9FAFB" : "#fff", outline: "none", ...style }} />
    </div>
  );
}

export function Select({ label, value, onChange, options = [], required, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{label}{required && " *"}</label>}
      <select value={value} onChange={onChange} disabled={disabled} required={required}
        style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.text, background: "#fff", outline: "none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: "14px 14px 0 0", width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, color = C.primary, bg }) {
  return (
    <Card style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: bg || color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
      </div>
    </Card>
  );
}

export function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}

export function Empty({ msg = "No data", icon = "📭" }) {
  return <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}><div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div><div>{msg}</div></div>;
}
