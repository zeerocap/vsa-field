import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, StatCard, Spinner, Btn } from "../../components/ui.jsx";
import { getFieldDashboard, getTodayStatus } from "../../api/field.api.js";
import { useNavigate } from "react-router-dom";

export default function ProDashboard({ authUser }) {
  const [data,    setData]    = useState(null);
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([getFieldDashboard(), getTodayStatus()])
      .then(([d, s]) => { setData(d); setStatus(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const checkedIn = status?.checked_in;
  const venue     = status?.venue_name || "—";
  const since     = status?.check_in_time ? new Date(status.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status card */}
      <Card style={{ padding: 20, background: checkedIn ? C.primary : C.card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: checkedIn ? C.accent : C.muted, marginBottom: 4 }}>
              {checkedIn ? "✅ CHECKED IN" : "⭕ NOT CHECKED IN"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: checkedIn ? "#fff" : C.text }}>{venue}</div>
            {since && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Since {since}</div>}
          </div>
          <Btn onClick={() => nav("/checkin")} variant={checkedIn ? "accent" : "primary"} size="sm">
            {checkedIn ? "Check Out" : "Check In"}
          </Btn>
        </div>
      </Card>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard label="Today Activities"  value={data?.today_activities  ?? 0} icon="📋" color={C.primary} />
        <StatCard label="Today Leads"       value={data?.today_leads       ?? 0} icon="👥" color={C.success} bg={C.successBg} />
        <StatCard label="This Month"        value={data?.month_activities  ?? 0} icon="📅" color={C.info}    bg={C.infoBg} />
        <StatCard label="Target Progress"   value={`${data?.target_pct ?? 0}%`} icon="🎯" color={C.accent}  bg={C.accent + "18"} />
      </div>

      {/* Quick actions */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "📋", label: "Log Activity",  path: "/activities" },
            { icon: "👥", label: "Add Lead",       path: "/leads" },
            { icon: "💰", label: "Log Expense",    path: "/expenses" },
            { icon: "🎯", label: "View Targets",   path: "/targets" },
          ].map(a => (
            <div key={a.path} onClick={() => nav(a.path)}
              style={{ background: C.bg, borderRadius: 10, padding: "14px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activities */}
      {data?.recent_activities?.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Recent Activities</div>
          {data.recent_activities.slice(0, 5).map((a, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.venue_name || a.type}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{a.type} · {a.duration_min ? a.duration_min + " min" : "—"}</div>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{new Date(a.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
