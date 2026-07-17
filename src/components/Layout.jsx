import { useNavigate, useLocation } from "react-router-dom";
import { getUser, clearAuth, isAdmin } from "../utils/auth.js";

const BRAND = "#7e1749";
const BRAND_BG = "#FDF2F7";

const PRO_NAV = [
  { path: "/",           icon: "🏠", label: "Home" },
  { path: "/checkin",    icon: "📍", label: "Check-In" },
  { path: "/activities", icon: "📋", label: "Activities" },
  { path: "/leads",      icon: "👥", label: "Leads" },
  { path: "/expenses",   icon: "💰", label: "Expenses" },
  { path: "/targets",    icon: "🎯", label: "Targets" },
];

const ADMIN_NAV = [
  { path: "/",          icon: "📊", label: "Dashboard" },
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
      <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>
        {/* White sidebar */}
        <div style={{ width: 220, background: "#fff", borderRight: "1px solid #E8E8E8",
          display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #E8E8E8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, background: BRAND, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>V</div>
              <div>
                <div style={{ color: BRAND, fontWeight: 800, fontSize: 14 }}>VSA FIELD</div>
                <div style={{ color: "#6B7280", fontSize: 10, marginTop: 1 }}>Field Marketing</div>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
            {items.map(item => {
              const active = loc.pathname === item.path;
              return (
                <div key={item.path} onClick={() => nav(item.path)}
                  style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", margin: "1px 8px", borderRadius: 8,
                    cursor: "pointer",
                    background: active ? BRAND_BG : "transparent",
                    color: active ? BRAND : "#6B7280",
                    fontSize: 13, fontWeight: active ? 600 : 400 }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
                </div>
              );
            })}
          </nav>
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E8E8E8" }}>
            <div style={{ fontSize: 12, color: "#111827", fontWeight: 600, marginBottom: 1 }}>{user?.username || user?.name}</div>
            <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8, textTransform: "capitalize" }}>{user?.role}</div>
            <div onClick={logout} style={{ fontSize: 12, color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>Sign out</div>
          </div>
        </div>
        <div style={{ marginLeft: 220, flex: 1, padding: "24px 28px", minHeight: "100vh" }}>{children}</div>
      </div>
    );
  }

  // PRO mobile
  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", paddingBottom: 68 }}>
      <div style={{ background: BRAND, padding: "13px 16px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 8px rgba(126,23,73,0.2)" }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>VSA FIELD</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Hi, {user?.username || user?.name}</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, cursor: "pointer" }} onClick={logout}>Sign out</div>
      </div>
      <div style={{ padding: "14px 14px" }}>{children}</div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff",
        display: "flex", zIndex: 100, borderTop: "1px solid #E8E8E8",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.07)" }}>
        {items.map(item => {
          const active = loc.pathname === item.path;
          return (
            <div key={item.path} onClick={() => nav(item.path)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                padding: "8px 2px 6px", cursor: "pointer",
                color: active ? BRAND : "#9CA3AF",
                borderTop: active ? `2px solid ${BRAND}` : "2px solid transparent",
                background: active ? BRAND_BG : "#fff" }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              <span style={{ fontSize: 9, marginTop: 2, fontWeight: active ? 700 : 400 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
