import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Btn } from "../../components/ui.jsx";
import { getFieldDashboard, getTodayStatus } from "../../api/field.api.js";
import { useNavigate } from "react-router-dom";

function KpiCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: bg || C.card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 500 }}>{label}</div>
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

  const checkedIn    = status?.checked_in;
  const venue        = status?.venue_name || "—";
  const since        = status?.check_in_time
    ? new Date(status.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const todayVisits  = data?.todayActivities?.length ?? 0;
  const todayLeads   = data?.todayLeadsCount  ?? 0;
  const weekVisits   = data?.weekVisits       ?? 0;
  const weekLeads    = data?.weekLeadsCount   ?? 0;
  const monthVisits  = data?.monthVisits      ?? 0;
  const monthLeads   = data?.monthLeadsCount  ?? 0;
  const monthName    = new Date().toLocaleString("default", { month: "short" });
  const recent       = data?.recentActivities || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 20, background: checkedIn ? C.brand : C.card, border: checkedIn ? "none" : `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, color: checkedIn ? "rgba(255,255,255,0.7)" : C.muted }}>
              {checkedIn ? "✅ CHECKED IN" : "⭕ NOT CHECKED IN"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: checkedIn ? "#fff" : C.text }}>{venue}</div>
            {since && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Since {since}</div>}
          </div>
          <Btn onClick={() => nav("/checkin")} size="sm"
            style={{ background: checkedIn ? "rgba(255,255,255,0.2)" : C.brand, color: "#fff", border: checkedIn ? "1px solid rgba(255,255,255,0.3)" : "none" }}>
            {checkedIn ? "Check Out" : "Check In"}
          </Btn>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <KpiCard label="Today'\''s Visits"    value={todayVisits}  icon="📋" color={C.brand}   bg={C.brandBg} />
        <KpiCard label="Today'\''s Leads"     value={todayLeads}   icon="👥" color={C.success} bg={C.successBg} />
        <KpiCard label="Week Visits"          value={weekVisits}   icon="📅" color={C.info}    bg={C.infoBg} />
        <KpiCard label="Week Leads"           value={weekLeads}    icon="🎯" color={C.warning} bg={C.warningBg} />
        <KpiCard label={`${monthName} Visits`} value={monthVisits} icon="🗓️" color={C.purple} bg="#F3E8FF" />
        <KpiCard label={`${monthName} Leads`}  value={monthLeads}  icon="💡" color="#0891B2"  bg="#E0F2FE" />
      </div>

      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "📋", label: "Log Activity", path: "/activities" },
            { icon: "👥", label: "Add Lead",      path: "/leads" },
            { icon: "💰", label: "Log Expense",   path: "/expenses" },
            { icon: "🎯", label: "View Targets",  path: "/targets" },
          ].map(a => (
            <div key={a.path} onClick={() => nav(a.path)}
              style={{ background: C.bg, borderRadius: 10, padding: "14px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {recent.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Recent Activities</div>
          {recent.slice(0, 5).map((a, i) => (
            <div key={i} style={{ padding: "10px 0", display: "flex", justifyContent: "space-between",
              borderBottom: i < Math.min(recent.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.venue_name || a.activity_type}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{a.activity_type}{a.leads_captured ? ` · ${a.leads_captured} leads` : ""}</div>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {a.activity_date ? new Date(a.activity_date).toLocaleDateString() : a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
