import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, Wifi, Navigation, Clock,
  Building2, Users, Target, Map, Layers, Camera,
  UserCheck, Fingerprint, ChevronLeft, ChevronRight,
  LogOut, Menu, X, Home, MapPin, ClipboardList,
  DollarSign, Grid,
} from "lucide-react";
import { getUser, clearAuth, isAdmin } from "../utils/auth.js";
import C from "../constants/theme.js";

const ADMIN_IDS = [
  "overview","activities","live","trail","sessions",
  "venues","leads","targets","map","territory","photos","logins","faceid",
];

const ADMIN_NAV = [
  { id: "overview",   label: "Overview",      icon: LayoutDashboard },
  { id: "activities", label: "Activities",    icon: Activity        },
  { id: "live",       label: "Live",          icon: Wifi            },
  { id: "trail",      label: "Trail",         icon: Navigation      },
  { id: "sessions",   label: "Sessions",      icon: Clock           },
  { id: "venues",     label: "Venues",        icon: Building2       },
  { id: "leads",      label: "Leads",         icon: Users           },
  { id: "targets",    label: "Targets",       icon: Target          },
  { id: "map",        label: "Map",           icon: Map             },
  { id: "territory",  label: "Territory",     icon: Layers          },
  { id: "photos",     label: "Photos",        icon: Camera          },
  { id: "logins",     label: "Login Selfies", icon: UserCheck       },
  { id: "faceid",     label: "Face ID",       icon: Fingerprint     },
];

const PRO_PRIMARY = [
  { path: "/",           label: "Home",       icon: Home          },
  { path: "/checkin",    label: "Check-In",   icon: MapPin        },
  { path: "/activities", label: "Activities", icon: ClipboardList },
  { path: "/leads",      label: "Leads",      icon: Users         },
];

const PRO_MORE = [
  { path: "/expenses", label: "Expenses", icon: DollarSign },
  { path: "/targets",  label: "Targets",  icon: Target     },
  { path: "/venues",   label: "Venues",   icon: Building2  },
];
const MORE_PATHS = PRO_MORE.map(n => n.path);

export default function Layout({ children }) {
  const nav  = useNavigate();
  const loc  = useLocation();
  const user = getUser();
  const admin = isAdmin(user);

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen,   setMoreOpen]   = useState(false);
  const [activeTab,  setActiveTab]  = useState(() => {
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
  function navToTab(id) { window.location.hash = "#" + id; setActiveTab(id); setMobileOpen(false); }

  const currentTab  = ADMIN_NAV.find(n => n.id === activeTab) || ADMIN_NAV[0];
  const isMore      = MORE_PATHS.includes(loc.pathname);
  const moreActive  = PRO_MORE.find(n => n.path === loc.pathname);

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  if (admin) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>

        {/* Desktop sidebar */}
        <aside className="vsa-field-sidebar" style={{
          width: collapsed ? 56 : 220, flexShrink: 0, background: C.sidebar,
          display: "flex", flexDirection: "column", transition: "width .22s ease",
          overflow: "hidden", height: "100vh", position: "sticky", top: 0,
          borderRight: `1px solid ${C.border}`,
        }}>
          {/* Logo */}
          <div style={{
            padding: collapsed ? "14px 0" : "16px 14px",
            display: "flex", alignItems: "center", gap: 10,
            borderBottom: `1px solid ${C.border}`, minHeight: 56,
            justifyContent: collapsed ? "center" : "flex-start",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: C.brand, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>V</span>
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.3, whiteSpace: "nowrap" }}>
                  VSA Field
                </div>
                <div style={{ fontSize: 10, color: C.faint, whiteSpace: "nowrap", marginTop: 1 }}>
                  Field Marketing Admin
                </div>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
            {ADMIN_NAV.map(item => {
              const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => navToTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 9,
                    padding: collapsed ? "9px 0" : "8px 10px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 7, marginBottom: 1, cursor: "pointer", border: "none",
                    background: active ? `${C.brand}12` : "transparent",
                    color: active ? C.brand : C.muted,
                    transition: "all .12s", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = `${C.brand}08`; e.currentTarget.style.color = C.text; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}
                >
                  <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {!collapsed && (
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer — user info + logout + collapse */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: collapsed ? "10px 0" : "10px 12px" }}>
            {!collapsed && user && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name || user.username}
                </div>
                <div style={{ fontSize: 11, color: C.faint, textTransform: "capitalize" }}>
                  {user.role || "Admin"}
                </div>
              </div>
            )}
            <button onClick={logout} title="Logout" style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: collapsed ? "8px 0" : "7px 8px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 7, border: "none", background: "transparent",
              color: C.danger, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit",
            }}>
              <LogOut size={15} />
              {!collapsed && "Logout"}
            </button>
            <button onClick={() => setCollapsed(p => !p)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: collapsed ? "8px 0" : "7px 8px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 7, border: "none", background: "transparent",
              color: C.faint, cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginTop: 2,
            }}>
              {collapsed
                ? <ChevronRight size={15} />
                : <><ChevronLeft size={15} /><span>Collapse</span></>
              }
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Mobile topbar */}
          <div className="vsa-field-topbar" style={{
            height: 52, background: C.card, borderBottom: `1px solid ${C.border}`,
            display: "none", alignItems: "center", padding: "0 16px", gap: 12,
            position: "sticky", top: 0, zIndex: 50,
          }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
              <Menu size={20} />
            </button>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>V</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>
              {currentTab?.label || "VSA Field"}
            </span>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${C.brand}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.brand }}>
                {(user?.name || user?.username || "A")[0].toUpperCase()}
              </span>
            </div>
          </div>

          {/* Mobile slide-in drawer */}
          {mobileOpen && (
            <>
              <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
              <div style={{
                position: "fixed", left: 0, top: 0, bottom: 0, width: 240,
                background: C.card, zIndex: 201, display: "flex", flexDirection: "column",
                boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
              }}>
                <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>V</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>VSA Field</div>
                      <div style={{ fontSize: 10, color: C.faint }}>Field Marketing Admin</div>
                    </div>
                  </div>
                  <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                    <X size={18} />
                  </button>
                </div>
                <nav style={{ flex: 1, padding: 8, overflowY: "auto" }}>
                  {ADMIN_NAV.map(item => {
                    const active = activeTab === item.id;
                    return (
                      <button key={item.id} onClick={() => navToTab(item.id)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 8, marginBottom: 1, border: "none",
                        background: active ? `${C.brand}12` : "transparent",
                        color: active ? C.brand : C.text, cursor: "pointer",
                        fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                      }}>
                        <item.icon size={17} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
                <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
                  {user && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{user.name || user.username}</div>
                      <div style={{ fontSize: 11, color: C.faint, textTransform: "capitalize" }}>{user.role || "Admin"}</div>
                    </div>
                  )}
                  <button onClick={() => { logout(); setMobileOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
                    background: "none", border: "none", color: C.danger, cursor: "pointer",
                    fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                  }}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Page content */}
          <main style={{ flex: 1, padding: "20px", overflowY: "auto", minHeight: 0 }}>
            {children}
          </main>
        </div>

        <style>{`
          .fm-tabbar { display: none !important; }
          .fm-tabbar { display: none !important; }
          @media (max-width: 767px) {
            .vsa-field-sidebar { display: none !important; }
            .vsa-field-topbar  { display: flex !important; }
          }
        `}</style>
      </div>
    );
  }

  // ── PRO (mobile-first) ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 68 }}>

      {/* Top bar */}
      <div style={{
        background: C.brand, padding: "12px 16px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 12px rgba(126,23,73,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "rgba(255,255,255,0.18)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.25)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>V</span>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>VSA Field</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              Hi, {(user?.name || user?.username || "").split(" ")[0]}
            </div>
          </div>
        </div>
        <button onClick={logout} style={{
          width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
        }} title="Sign out">
          <LogOut size={14} color="rgba(255,255,255,0.9)" />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 14px" }}>
        {children}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: C.card, borderTop: `1px solid ${C.border}`,
        display: "flex", zIndex: 100,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {PRO_PRIMARY.map(item => {
          const active = loc.pathname === item.path;
          return (
            <button key={item.path}
              onClick={() => { setMoreOpen(false); nav(item.path); }}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "9px 0 8px", cursor: "pointer",
                border: "none", background: "none", fontFamily: "inherit",
                color: active ? C.brand : C.faint, transition: "color .15s",
                position: "relative",
              }}>
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "15%", right: "15%",
                  height: 2.5, background: C.brand, borderRadius: "0 0 3px 3px",
                }} />
              )}
              <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, marginTop: 3 }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button onClick={() => setMoreOpen(p => !p)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "9px 0 8px", cursor: "pointer",
            border: "none", background: "none", fontFamily: "inherit",
            color: isMore || moreOpen ? C.brand : C.faint, transition: "color .15s",
            position: "relative",
          }}>
          {(isMore || moreOpen) && (
            <div style={{
              position: "absolute", top: 0, left: "15%", right: "15%",
              height: 2.5, background: C.brand, borderRadius: "0 0 3px 3px",
            }} />
          )}
          <Grid size={20} strokeWidth={(isMore || moreOpen) ? 2.2 : 1.8} />
          <span style={{ fontSize: 10, fontWeight: (isMore || moreOpen) ? 700 : 500, marginTop: 3 }}>
            {isMore && moreActive ? moreActive.label : "More"}
          </span>
        </button>
      </div>

      {/* More sheet */}
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 98,
            background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
          }} />
          <div style={{
            position: "fixed", bottom: 68, left: 12, right: 12, zIndex: 99,
            background: C.card, borderRadius: 18, padding: "6px 0 10px",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          }}>
            <div style={{
              textAlign: "center", padding: "10px 0 14px", marginBottom: 6,
              fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: 0.5,
              textTransform: "uppercase", borderBottom: `1px solid ${C.border}`,
            }}>More</div>
            {PRO_MORE.map(item => {
              const active = loc.pathname === item.path;
              return (
                <button key={item.path}
                  onClick={() => { setMoreOpen(false); nav(item.path); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 20px", cursor: "pointer", width: "100%",
                    background: active ? `${C.brand}08` : "transparent",
                    border: "none", fontFamily: "inherit",
                    transition: "background 0.12s",
                  }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: active ? C.brand : C.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${active ? C.brand : C.border}`,
                  }}>
                    <item.icon size={18} color={active ? "#fff" : C.muted} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: active ? 600 : 500, color: active ? C.brand : C.text }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
