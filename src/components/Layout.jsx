import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUser, clearAuth, isAdmin } from "../utils/auth.js";
import C from "../constants/theme.js";
import Icon from "./Icons.jsx";

// PRO primary nav (5 items) + More items
const PRIMARY_NAV = [
  { path: "/",           icon: "home",      label: "Home" },
  { path: "/checkin",    icon: "mappin",    label: "Check-In" },
  { path: "/activities", icon: "clipboard", label: "Activities" },
  { path: "/leads",      icon: "users",     label: "Leads" },
];
const MORE_NAV = [
  { path: "/expenses",   icon: "wallet",    label: "Expenses" },
  { path: "/targets",    icon: "target",    label: "Targets" },
  { path: "/venues",     icon: "building",  label: "Venues" },
];
const MORE_PATHS = MORE_NAV.map(n => n.path);

// VSA Map Pin logo
function VSAPin({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2C10.48 2 6 6.48 6 12c0 8 10 18 10 18s10-10 10-18c0-5.52-4.48-10-10-10z"
        fill="#7e1749"/>
      <circle cx="16" cy="12" r="4" fill="#fff"/>
    </svg>
  );
}

export default function Layout({ children }) {
  const nav   = useNavigate();
  const loc   = useLocation();
  const user  = getUser();
  const admin = isAdmin(user);
  const [moreOpen, setMoreOpen] = useState(false);

  function logout() { clearAuth(); nav("/login", { replace: true }); }

  // ── Admin ────────────────────────────────────────────────────────────────
  if (admin) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
        <div style={{
          background: "#fff", borderBottom: `1px solid ${C.border}`,
          padding: "0 20px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <VSAPin size={30} />
            <div>
              <div style={{ color: C.brand, fontWeight: 800, fontSize: 14, letterSpacing: 0.5,
                lineHeight: 1.2 }}>VSA FIELD</div>
              <div style={{ color: C.faint, fontSize: 10, letterSpacing: 0.3 }}>FIELD MARKETING ADMIN</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                {user?.name || user?.username}
              </div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "capitalize" }}>
                {user?.role || "Admin"}
              </div>
            </div>
            <div style={{ width: 34, height: 34, background: C.brand, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              flexShrink: 0 }}
              title="Sign out" onClick={logout}>
              <Icon name="log-out" size={15} color="#fff" />
            </div>
          </div>
        </div>
        <div>{children}</div>
      </div>
    );
  }

  // ── PRO ─────────────────────────────────────────────────────────────────
  const isMore = MORE_PATHS.includes(loc.pathname);
  const activeItem = MORE_NAV.find(n => n.path === loc.pathname);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", paddingBottom: 68 }}>

      {/* PRO Top bar */}
      <div style={{
        background: C.brand,
        padding: "12px 16px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 12px rgba(126,23,73,0.35)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.25)" }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C10.48 2 6 6.48 6 12c0 8 10 18 10 18s10-10 10-18c0-5.52-4.48-10-10-10z" fill="#fff"/>
              <circle cx="16" cy="12" r="4" fill="#7e1749"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>VSA FIELD</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
              Hi, {(user?.name || user?.username || "").split(" ")[0]} 👋
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)" }}
            onClick={logout} title="Sign out">
            <Icon name="log-out" size={14} color="rgba(255,255,255,0.9)" />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: "16px 14px", animation: "fadeIn 0.2s ease" }}>
        {children}
      </div>

      {/* Bottom nav — 5 items */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", zIndex: 100,
        borderTop: `1px solid ${C.border}`,
        boxShadow: "0 -2px 16px rgba(0,0,0,0.07)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {PRIMARY_NAV.map(item => {
          const active = loc.pathname === item.path;
          return (
            <div key={item.path} onClick={() => { setMoreOpen(false); nav(item.path); }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "9px 0 8px", cursor: "pointer",
                color: active ? C.brand : C.faint, transition: "color 0.15s",
                position: "relative" }}>
              {active && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%",
                height: 2.5, background: C.brand, borderRadius: "0 0 3px 3px" }} />}
              <Icon name={item.icon} size={21} color={active ? C.brand : C.faint} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, marginTop: 3,
                letterSpacing: 0.2 }}>{item.label}</span>
            </div>
          );
        })}

        {/* More button */}
        <div onClick={() => setMoreOpen(p => !p)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "9px 0 8px", cursor: "pointer",
            color: isMore || moreOpen ? C.brand : C.faint, transition: "color 0.15s",
            position: "relative" }}>
          {(isMore || moreOpen) && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%",
            height: 2.5, background: C.brand, borderRadius: "0 0 3px 3px" }} />}
          <Icon name="grid" size={21} color={isMore || moreOpen ? C.brand : C.faint} />
          <span style={{ fontSize: 10, fontWeight: (isMore || moreOpen) ? 700 : 500, marginTop: 3,
            letterSpacing: 0.2 }}>{isMore && activeItem ? activeItem.label : "More"}</span>
        </div>
      </div>

      {/* More sheet */}
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(2px)" }} />
          <div style={{
            position: "fixed", bottom: 68, left: 12, right: 12, zIndex: 99,
            background: "#fff", borderRadius: 18, padding: "6px 0 10px",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease",
          }}>
            <div style={{ textAlign: "center", padding: "10px 0 14px",
              fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5,
              textTransform: "uppercase", borderBottom: `1px solid ${C.border}`,
              marginBottom: 6 }}>More</div>
            {MORE_NAV.map(item => {
              const active = loc.pathname === item.path;
              return (
                <div key={item.path}
                  onClick={() => { setMoreOpen(false); nav(item.path); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "13px 20px", cursor: "pointer",
                    background: active ? C.brandBg : "transparent",
                    transition: "background 0.12s",
                  }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10,
                    background: active ? C.brand : C.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${active ? C.brand : C.border}` }}>
                    <Icon name={item.icon} size={18} color={active ? "#fff" : C.muted} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: active ? 700 : 500,
                    color: active ? C.brand : C.text }}>{item.label}</span>
                  {active && <Icon name="check-circle" size={16} color={C.brand} style={{ marginLeft: "auto" }} />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
