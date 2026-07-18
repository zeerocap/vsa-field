import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Btn } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getFieldDashboard, getTodayStatus } from "../../api/field.api.js";
import { useNavigate } from "react-router-dom";

function KpiCard({ label, value, icon, color, bg }) {
  return (
    <div style={{
      background: bg || C.card, borderRadius: 10, padding: "12px 14px",
      border: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: (color || C.brand) + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={14} color={color || C.brand} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

export default function ProDashboard() {
  const [data,    setData]    = useState(null);
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([getFieldDashboard(), getTodayStatus()])
      .then(([d, s]) => { setData(d); setStatus(s); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const checkedIn  = status?.checked_in;
  const venue      = status?.venue_name || "—";
  const since      = status?.check_in_time
    ? new Date(status.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const todayVisits = data?.todayActivities?.length ?? 0;
  const todayLeads  = data?.todayLeadsCount  ?? 0;
  const weekVisits  = data?.weekVisits       ?? 0;
  const weekLeads   = data?.weekLeadsCount   ?? 0;
  const monthVisits = data?.monthVisits      ?? 0;
  const monthLeads  = data?.monthLeadsCount  ?? 0;
  const monthName   = new Date().toLocaleString("default", { month: "short" });
  const recent      = data?.recentActivities || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Status card */}
      <Card style={{
        padding: 20,
        background: checkedIn ? C.brand : C.card,
        border: checkedIn ? "none" : `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Icon
                name={checkedIn ? "check-circle" : "mappin"}
                size={13}
                color={checkedIn ? "rgba(255,255,255,0.85)" : C.muted}
              />
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                color: checkedIn ? "rgba(255,255,255,0.75)" : C.muted,
              }}>
                {checkedIn ? "CHECKED IN" : "NOT CHECKED IN"}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: checkedIn ? "#fff" : C.text }}>{venue}</div>
            {since && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Since {since}</div>}
          </div>
          <Btn
            onClick={() => nav("/checkin")}
            size="sm"
            style={{
              background: checkedIn ? "rgba(255,255,255,0.2)" : C.brand,
              color: "#fff",
              border: checkedIn ? "1px solid rgba(255,255,255,0.3)" : "none",
            }}
          >
            {checkedIn ? "Check Out" : "Check In"}
          </Btn>
        </div>
      </Card>

      {/* 6 KPI cards — 3+3 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        <KpiCard label="Today Visits"     value={todayVisits}  icon="mappin"    color={C.brand}   bg={C.brandBg} />
        <KpiCard label="Today Leads"      value={todayLeads}   icon="users"     color={C.success} bg={C.successBg} />
        <KpiCard label="Week Visits"      value={weekVisits}   icon="clipboard" color={C.info}    bg={C.infoBg} />
        <KpiCard label="Week Leads"       value={weekLeads}    icon="target"    color="#7C3AED"   bg="#F5F3FF" />
        <KpiCard label={`${monthName} Visits`} value={monthVisits} icon="map"  color="#0891B2"   bg="#E0F2FE" />
        <KpiCard label={`${monthName} Leads`}  value={monthLeads}  icon="trending-up" color="#B45309" bg="#FEF3C7" />
      </div>

      {/* Quick actions */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "clipboard", label: "Log Activity", path: "/activities", color: C.brand },
            { icon: "users",     label: "Add Lead",     path: "/leads",      color: C.success },
            { icon: "wallet",    label: "Log Expense",  path: "/expenses",   color: C.warning },
            { icon: "target",    label: "View Targets", path: "/targets",    color: C.info },
          ].map(a => (
            <div
              key={a.path}
              onClick={() => nav(a.path)}
              style={{
                background: C.bg, borderRadius: 10, padding: "14px 12px",
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                border: `1px solid ${C.border}`, transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.brandBg}
              onMouseLeave={e => e.currentTarget.style.background = C.bg}
            >
              <Icon name={a.icon} size={18} color={a.color} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activities */}
      {recent.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Recent Activities</div>
          {recent.slice(0, 5).map((a, i) => (
            <div
              key={i}
              style={{
                padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                borderBottom: i < Math.min(recent.length, 5) - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {a.venue_name || a.activity_type || a.type || "Activity"}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {a.activity_type || a.type || ""}
                  {a.leads_captured ? ` · ${a.leads_captured} lead${a.leads_captured !== 1 ? "s" : ""}` : ""}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.muted, textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                {a.activity_date
                  ? new Date(a.activity_date).toLocaleDateString()
                  : a.created_at
                    ? new Date(a.created_at).toLocaleDateString()
                    : ""}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
