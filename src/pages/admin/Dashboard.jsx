import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, StatCard } from "../../components/ui.jsx";
import { getFieldDashboard, getUsers } from "../../api/field.api.js";

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFieldDashboard(), getUsers()])
      .then(([d, u]) => { setData(d); setUsers(u?.users || u || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const pros = users.filter(u => u.role === "pro");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 22, color: C.text }}>Field Overview</div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <StatCard label="Active Sessions"  value={data?.active_sessions  ?? 0} icon="🟢" />
        <StatCard label="Total PROs"       value={pros.length}                 icon="👤" />
        <StatCard label="Today Leads"      value={data?.today_leads      ?? 0} icon="👥" />
        <StatCard label="Today Activities" value={data?.today_activities ?? 0} icon="📋" />
      </div>

      {/* Live PRO Status */}
      <Card>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>Live PRO Status</div>
        {pros.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>No PRO users found</div>
        ) : pros.map((u, i) => {
          const session = data?.sessions?.find(s => s.user_id === u.id && !s.checkout_time);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < pros.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{u.name || u.username}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{u.centre || "—"}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {session ? (
                  <>
                    <span style={{ background: "#e8f5e9", color: "#388e3c", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>● ACTIVE</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{session.venue_name || "Unknown venue"}</span>
                  </>
                ) : (
                  <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>Offline</span>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Recent Activity */}
      {data?.recent_activities?.length > 0 && (
        <Card>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>Recent Activities</div>
          {data.recent_activities.slice(0, 8).map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
              borderBottom: i < 7 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 13, color: C.text }}>{a.user_name} · <span style={{ color: C.muted }}>{a.type}</span></div>
              <div style={{ fontSize: 11, color: C.muted }}>{new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
