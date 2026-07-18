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

const ADMIN_NAV = [
  { path: "/",           icon: "barchart",  label: "Dashboard" },
  { path: "/activities", icon: "clipboard", label: "Activities" },
  { path: "/sessions",   icon: "mappin",    label: "Sessions" },
  { path: "/map",        icon: "map",       label: "Map" },
  { path: "/trail",      icon: "route",     label: "Trail" },
  { path: "/gallery",    icon: "camera",    label: "Gallery" },
  { path: "/venues",     icon: "building",  label: "Venues" },
  { path: "/leads",      icon: "users",     label: "Field Leads" },
  { path: "/targets",    icon: "target",    label: "Targets" },
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
        {/* ── Sidebar ── white, matches CRM */}
        <div style={{
          width: 220, background: "#FFFFFF",
          borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
          boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
        }}>
          {/* Brand */}
          <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, background: C.brand, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 15, fontWeight: 800, flexShrink: 0,
              }}>V</div>
              <div>
                <div style={{ color: C.brand, fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>VSA FIELD</div>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>Field Marketing</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
            {items.map(item => {
              const active = loc.pathname === item.path;
              return (
                <div key={item.path} onClick={() => nav(item.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 18px", cursor: "pointer",
                    margin: "1px 8px", borderRadius: 8,
                    background: active ? C.brandBg : "transparent",
                    color: active ? C.brand : C.muted,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: "all 0.15s",
                  }}>
                  <Icon name={item.icon} size={16} color={active ? C.brand : C.muted} />
                  {item.label}
                </div>
              );
            })}
          </nav>

          {/* User footer */}
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: C.brandBg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.brand }}>
                  {(user?.name || user?.username || "A").charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || user?.username}
                </div>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>
                  {user?.role}
                </div>
              </div>
            </div>
            <div onClick={logout}
              style={{ fontSize: 12, color: C.danger, cursor: "pointer", fontWeight: 600 }}>
              Sign out
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ marginLeft: 220, flex: 1, padding: "28px 32px", minHeight: "100vh" }}>
          {children}
        </div>
      </div>
    );
  }

  // ── PRO — mobile layout ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 72 }}>
      {/* Top bar — burgundy */}
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
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, cursor: "pointer", fontWeight: 500 }} onClick={logout}>
          Sign out
        </div>
      </div>

      {/* Content */}
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
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "9px 0", cursor: "pointer",
                color: active ? C.brand : C.faint,
                transition: "color 0.15s", position: "relative",
              }}>
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "10%", right: "10%",
                  height: 2, background: C.brand, borderRadius: "0 0 3px 3px",
                }} />
              )}
              <Icon name={item.icon} size={19} color={active ? C.brand : C.faint} />
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 400,
                marginTop: 4, letterSpacing: 0.3,
              }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
