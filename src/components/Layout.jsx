import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUser, clearAuth, isAdmin } from "../utils/auth.js";
import C from "../constants/theme.js";
import Icon from "./Icons.jsx";

// PRO primary nav (4 items + More)
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

// Admin sidebar — 13 sections matching AdminPage TABS
const ADMIN_NAV = [
  { id: "overview",   label: "Overview",      icon: "grid"      },
  { id: "activities", label: "Activities",    icon: "activity"  },
  { id: "live",       label: "Live",          icon: "wifi"      },
  { id: "trail",      label: "Trail",         icon: "route"     },
  { id: "sessions",   label: "Sessions",      icon: "clock"     },
  { id: "venues",     label: "Venues",        icon: "building"  },
  { id: "leads",      label: "Leads",         icon: "users"     },
  { id: "targets",    label: "Targets",       icon: "target"    },
  { id: "map",        label: "Map",           icon: "map"       },
  { id: "territory",  label: "Territory",     icon: "mappin"    },
  { id: "photos",     label: "Photos",        icon: "camera"    },
  { id: "logins",     label: "Login Selfies", icon: "user"      },
  { id: "faceid",     label: "Face ID",       icon: "scan-face" },
];
const ADMIN_IDS = ADMIN_NAV.map(n => n.id);

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
  const nav  = useNavigate();
  const loc  = useLocation();
  const user = getUser();
  const admin = isAdmin(user);
  const [moreOpen, setMoreOpen] = useState(false);

  // Admin: active tab synced with URL hash
  const [activeTab, setActiveTab] = useState(() => {
    const h = window.location.hash.slice(1);
    return ADMIN_IDS.includes(h) ? h : "overview";
  });

  useEffect(() => {
    if (!admin) return;
    function onHash() {
      const h = window.location.hash.slice(1);
      if (ADMIN_IDS.includes(h)) setActiveTab(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [admin]);

  function logout() { clearAuth(); nav("/login", { replace: true }); }

  function navToTab(id) {
    window.location.hash = "#" + id;
    setActiveTab(id);
  }

  // ── Admin — left sidebar + content ──────────────────────────────────────
  if (admin) {
    return (
      <div className="admin-layout" style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>

        {/* Sidebar */}
        <div style={{
          width: 240, flexShrink: 0,
          background: "#fff", borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0,
          zIndex: 100, boxShadow: "2px 0 16px rgba(0,0,0,0.05)",
        }}>

          {/* Brand */}
          <div style={{
            padding: "18px 18px 14px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <VSAPin size={32} />
            <div>
              <div style={{ color: C.brand, fontWeight: 800, fontSize: 14, letterSpacing: 0.5, lineHeight: 1.2 }}>
                VSA FIELD
              </div>
              <div style={{ color: C.faint, fontSize: 10, letterSpacing: 0.3, textTransform: "uppercase" }}>
                Admin Panel
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 6px" }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: C.faint,
              letterSpacing: 0.8, textTransform: "uppercase",
              padding: "6px 12px 8px", marginBottom: 2,
            }}>
              Sections
            </div>
            {ADMIN_NAV.map(item => {
              const active = activeTab === item.id;
              return (
                <div key={item.id} onClick={() => navToTab(item.id)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 9, cursor: "pointer",
                  marginBottom: 1,
                  background: active ? `${C.brand}12` : "transparent",
                  transition: "background 0.12s",
                }}>
                  <Icon name={item.icon} size={16} color={active ? C.brand : C.muted} />
                  <span style={{
                    fontSize: 13.5, fontWeight: active ? 700 : 500,
                    color: active ? C.brand : C.text, flex: 1,
                  }}>
                    {item.label}
                  </span>
                  {active && (
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.brand }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* User + logout */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, background: C.brand, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="user" size={18} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 700, color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {user?.name || user?.username}
                </div>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>
                  {user?.role || "Admin"}
                </div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
                onClick={logout} title="Sign out">
                <Icon name="log-out" size={14} color={C.muted} />
              </div>
            </div>
          </div>
        </div>

        {/* Main content — offset by sidebar */}
        <div style={{ marginLeft: 240, flex: 1, minWidth: 0, overflowX: "hidden" }}>
          <style>{".admin-layout .fm-tabbar { display: none !important; }"}</style>
          {children}
        </div>
      </div>
    );
  }

  // ── PRO — top bar + bottom nav ───────────────────────────────────────────
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
          <div style={{
            width: 36, height: 36, background: "rgba(255,255,255,0.15)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.25)",
          }}>
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
          <div style={{
            width: 32, height: 32, background: "rgba(255,255,255,0.15)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)",
          }}
            onClick={logout} title="Sign out">
            <Icon name="log-out" size={14} color="rgba(255,255,255,0.9)" />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: "16px 14px", animation: "fadeIn 0.2s ease" }}>
        {children}
      </div>

      {/* Bottom nav — 4 primary + More */}
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
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "9px 0 8px", cursor: "pointer",
                color: active ? C.brand : C.faint, transition: "color 0.15s",
                position: "relative",
              }}>
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "20%", right: "20%",
                  height: 2.5, background: C.brand, borderRadius: "0 0 3px 3px",
                }} />
              )}
              <Icon name={item.icon} size={21} color={active ? C.brand : C.faint} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, marginTop: 3, letterSpacing: 0.2 }}>
                {item.label}
              </span>
            </div>
          );
        })}

        {/* More button */}
        <div onClick={() => setMoreOpen(p => !p)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "9px 0 8px", cursor: "pointer",
            color: isMore || moreOpen ? C.brand : C.faint, transition: "color 0.15s",
            position: "relative",
          }}>
          {(isMore || moreOpen) && (
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%",
              height: 2.5, background: C.brand, borderRadius: "0 0 3px 3px",
            }} />
          )}
          <Icon name="grid" size={21} color={isMore || moreOpen ? C.brand : C.faint} />
          <span style={{ fontSize: 10, fontWeight: (isMore || moreOpen) ? 700 : 500, marginTop: 3, letterSpacing: 0.2 }}>
            {isMore && activeItem ? activeItem.label : "More"}
          </span>
        </div>
      </div>

      {/* More sheet */}
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 98,
              background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
            }} />
          <div style={{
            position: "fixed", bottom: 68, left: 12, right: 12, zIndex: 99,
            background: "#fff", borderRadius: 18, padding: "6px 0 10px",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease",
          }}>
            <div style={{
              textAlign: "center", padding: "10px 0 14px",
              fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5,
              textTransform: "uppercase", borderBottom: `1px solid ${C.border}`,
              marginBottom: 6,
            }}>More</div>
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
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: active ? C.brand : C.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${active ? C.brand : C.border}`,
                  }}>
                    <Icon name={item.icon} size={18} color={active ? "#fff" : C.muted} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: active ? 700 : 500, color: active ? C.brand : C.text }}>
                    {item.label}
                  </span>
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
