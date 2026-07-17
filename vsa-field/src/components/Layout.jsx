import { useNavigate, useLocation } from "react-router-dom";
import { getUser, clearAuth, isAdmin } from "../utils/auth.js";
import C from "../constants/theme.js";

const PRO_NAV = [
  { path: "/",           icon: "🏠", label: "Home" },
  { path: "/checkin",    icon: "📍", label: "Check-In" },
  { path: "/activities", icon: "📋", label: "Activities" },
  { path: "/leads",      icon: "👥", label: "Leads" },
  { path: "/expenses",   icon: "💰", label: "Expenses" },
  { path: "/targets",    icon: "🎯", label: "Targets" },
];

const ADMIN_NAV = [
  { path: "/",          icon: "🏠", label: "Dashboard" },
  { path: "/sessions",  icon: "📍", label: "Sessions" },
  { path: "/map",       icon: "🗺️",  label: "Map" },
  { path: "/trail",     icon: "🛤️",  label: "Trail" },
  { path: "/gallery",   icon: "📸", label: "Gallery" },
  { path: "/venues",    icon: "🏢", label: "Venues" },
  { path: "/leads",     icon: "👥", label: "Field Leads" },
  { path: "/targets",   icon: "🎯", label: "Targets" },
];

export default function Layout({ children }) {
  const nav   = useNavigate();
  const loc   = useLocation();
  const user  = getUser();
  const admin = isAdmin(user);
  const items = admin ? ADMIN_NAV : PRO_NAV;

  function logout() { clearAuth(); nav("/login", { replace: true }); }

  if (admin) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: C.sidebar, display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
          <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ color: C.accent, fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>VSA FIELD</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>Field Marketing</div>
          </div>
          <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
            {items.map(item => {
              const active = loc.pathname === item.path;
              return (
                <div key={item.path} onClick={() => nav(item.path)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", cursor: "pointer",
                    background: active ? "rgba(201,168,76,0.15)" : "transparent",
                    borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                    color: active ? C.accent : "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: active ? 600 : 400 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                </div>
              );
            })}
          </nav>
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6 }}>{user?.username || user?.name}</div>
            <div style={{ color: "#EF4444", fontSize: 13, cursor: "pointer", fontWeight: 600 }} onClick={logout}>Logout</div>
          </div>
        </div>
        {/* Main */}
        <div style={{ marginLeft: 220, flex: 1, padding: 24 }}>{children}</div>
      </div>
    );
  }

  // PRO — mobile layout
  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 72 }}>
      {/* Top bar */}
      <div style={{ background: C.sidebar, padding: "14px 16px", display: "flex",
        justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ color: C.accent, fontWeight: 800, fontSize: 15 }}>VSA FIELD</div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>Hi, {user?.username || user?.name}</div>
        </div>
        <div style={{ color: "#EF4444", fontSize: 13, cursor: "pointer", fontWeight: 600 }} onClick={logout}>Logout</div>
      </div>
      {/* Content */}
      <div style={{ padding: "16px 14px" }}>{children}</div>
      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.sidebar,
        display: "flex", zIndex: 100, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {items.map(item => {
          const active = loc.pathname === item.path;
          return (
            <div key={item.path} onClick={() => nav(item.path)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                padding: "10px 4px 8px", color: active ? C.accent : "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 10, marginTop: 2, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
