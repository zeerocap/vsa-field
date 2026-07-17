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
  { path: "/venues",     icon: "🏢", label: "Venues" },
];

const ADMIN_NAV = [
  { path: "/",           icon: "📊", label: "Dashboard" },
  { path: "/activities", icon: "📋", label: "Activities" },
  { path: "/sessions",   icon: "📍", label: "Sessions" },
  { path: "/map",        icon: "🗺️",  label: "Map" },
  { path: "/trail",      icon: "🛤️",  label: "Trail" },
  { path: "/gallery",    icon: "📸", label: "Gallery" },
  { path: "/venues",     icon: "🏢", label: "Venues" },
  { path: "/leads",      icon: "👥", label: "Field Leads" },
  { path: "/targets",    icon: "🎯", label: "Targets" },
  { path: "/venues",     icon: "🏢", label: "Venues" },
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
        <div style={{
          width: 220, background: "#FFFFFF",
          borderRight: "1px solid #E8E8E8",
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
          boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #E8E8E8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, background: "#7e1749", borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 14, fontWeight: 800,
              }}>V</div>
              <div>
                <div style={{ color: "#7e1749", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>VSA FIELD</div>
                <div style={{ color: "#6B7280", fontSize: 10, marginTop: 1 }}>Field Marketing</div>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
            {items.map(item => {
              const active = loc.pathname === item.path;
              return (
                <div key={item.path} onClick={() => nav(item.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 20px", cursor: "pointer",
                    margin: "1px 8px", borderRadius: 8,
                    background: active ? "#FDF2F7" : "transparent",
                    color: active ? "#7e1749" : "#6B7280",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>{item.label}
                </div>
              );
            })}
          </nav>
          <div style={{ padding: "14px 20px", borderTop: "1px solid #E8E8E8" }}>
            <div style={{ fontSize: 12, color: "#111827", fontWeight: 600, marginBottom: 2 }}>
              {user?.name || user?.username}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, textTransform: "capitalize" }}>
              {user?.role}
            </div>
            <div onClick={logout} style={{ fontSize: 12, color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>
              Sign out
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 220, flex: 1, padding: 28, minHeight: "100vh" }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", paddingBottom: 72 }}>
      <div style={{
        background: "#7e1749", padding: "14px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 8px rgba(126,23,73,0.3)",
      }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>VSA FIELD</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Hi, {user?.name || user?.username}</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer" }} onClick={logout}>Sign out</div>
      </div>
      <div style={{ padding: "16px 14px" }}>{children}</div>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", display: "flex", zIndex: 100,
        borderTop: "1px solid #E8E8E8",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}>
        {items.map(item => {
          const active = loc.pathname === item.path;
          return (
            <div key={item.path} onClick={() => nav(item.path)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "8px 0", cursor: "pointer",
                color: active ? "#7e1749" : "#9CA3AF",
                transition: "color 0.15s",
              }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, marginTop: 3 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
