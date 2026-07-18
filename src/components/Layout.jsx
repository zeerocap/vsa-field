import { useNavigate, useLocation } from "react-router-dom";
import { getUser, clearAuth, isAdmin } from "../utils/auth.js";
import C from "../constants/theme.js";
import Icon from "./Icons.jsx";

const PRO_NAV = [
  { path: "/",           icon: "home",      label: "Home" },
  { path: "/checkin",    icon: "mappin",    label: "Check-In" },
  { path: "/activities", icon: "clipboard", label: "Activities" },
  { path: "/leads",      icon: "users",     label: "Leads" },
  { path: "/expenses",   icon: "wallet",    label: "Expenses" },
  { path: "/targets",    icon: "target",    label: "Targets" },
  { path: "/venues",     icon: "building",  label: "Venues" },
];

export default function Layout({ children }) {
  const nav   = useNavigate();
  const user  = getUser();
  const admin = isAdmin(user);

  function logout() { clearAuth(); nav("/login", { replace: true }); }

  // ── Admin — simple top bar, no sidebar (AdminPage has its own tabs) ────────
  if (admin) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
        {/* Top bar */}
        <div style={{
          background: "#FFFFFF", borderBottom: `1px solid #E8E8E8`,
          padding: "0 28px", height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: C.brand, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>V</div>
            <div style={{ color: C.brand, fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>VSA FIELD</div>
            <div style={{ color: C.faint, fontSize: 11, marginLeft: 4 }}>· Field Marketing Admin</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.muted }}>{user?.name || user?.username}</div>
            <div onClick={logout} style={{ fontSize: 12, color: C.danger, cursor: "pointer", fontWeight: 600 }}>Sign out</div>
          </div>
        </div>
        {/* Content */}
        <div style={{ padding: "20px 24px" }}>{children}</div>
      </div>
    );
  }

  // ── PRO — mobile bottom nav ───────────────────────────────────────────────
  const loc   = useNavigate ? useLocation() : { pathname: "/" };
  const items = PRO_NAV;
  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", paddingBottom: 72 }}>
      {/* Top bar */}
      <div style={{
        background: C.brand, padding: "14px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 8px rgba(126,23,73,0.3)",
      }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>VSA FIELD</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Hi, {user?.name || user?.username}</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, cursor: "pointer", fontWeight: 500 }} onClick={logout}>Sign out</div>
      </div>

      <div style={{ padding: "16px 14px" }}>{children}</div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", display: "flex", zIndex: 100,
        borderTop: `1px solid ${C.border}`,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}>
        {items.map(item => {
          const active = loc.pathname === item.path;
          return (
            <div key={item.path} onClick={() => nav(item.path)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "9px 0", cursor: "pointer", color: active ? C.brand : C.faint, transition: "color 0.15s", position: "relative" }}>
              {active && <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 2, background: C.brand, borderRadius: "0 0 3px 3px" }} />}
              <Icon name={item.icon} size={19} color={active ? C.brand : C.faint} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, marginTop: 4, letterSpacing: 0.3 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
