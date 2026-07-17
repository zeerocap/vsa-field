import { useState, useEffect } from "react";
import { getFieldDashboard, getUsers, getSessions, getActivities } from "../../api/field.api.js";

const BRAND = "#7e1749";
const C = { text:"#111827", muted:"#6B7280", border:"#E8E8E8", bg:"#F7F8FA", card:"#fff",
  success:"#16A34A", successBg:"#F0FDF4", info:"#2563EB", infoBg:"#EFF6FF",
  warning:"#D97706", warningBg:"#FFFBEB" };

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }}>{children}</div>;
}
function Stat({ label, value, sub, color = BRAND }) {
  return (
    <Card style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

export default function AdminDashboard() {
  const [data,       setData]       = useState(null);
  const [users,      setUsers]      = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([getFieldDashboard(), getUsers(), getSessions({}), getActivities({})])
      .then(([d, u, s, a]) => {
        setData(d);
        setUsers(u?.users || u || []);
        setSessions(s?.sessions || s || []);
        setActivities(a?.activities || a || []);
      })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: BRAND,
        borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const pros       = users.filter(u => u.role === "pro");
  const active     = sessions.filter(s => !s.checkout_time);
  const today      = new Date().toDateString();
  const todayActs  = activities.filter(a => new Date(a.created_at).toDateString() === today);

  // Activity type breakdown
  const byType = {};
  activities.forEach(a => { byType[a.type] = (byType[a.type] || { visits: 0, leads: 0 }); byType[a.type].visits++; });
  const typeRows = Object.entries(byType).sort((x, y) => y[1].visits - x[1].visits).slice(0, 6);
  const maxVisits = Math.max(...typeRows.map(r => r[1].visits), 1);

  // PRO leaderboard — activities + leads per PRO
  const proStats = pros.map(u => {
    const acts  = activities.filter(a => a.user_id === u.id || a.user_name === u.username);
    const last  = acts[0]?.created_at;
    return { name: u.name || u.username, centre: u.centre || "—", acts: acts.length, last };
  }).sort((a, b) => b.acts - a.acts);

  // Venue coverage
  const venues = [...new Set(activities.map(a => a.venue_id).filter(Boolean))].length;

  function daysAgo(dt) {
    if (!dt) return "Never";
    const d = Math.floor((Date.now() - new Date(dt)) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Field Marketing</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>PRO activities, leads and venues · all centres</div>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: BRAND }}>{activities.length}</div>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>ACTS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: BRAND }}>{pros.length}</div>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>PROS</div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Stat label="Total Activities"  value={activities.length} sub={`${todayActs.length} today`} color={BRAND} />
        <Stat label="Active Sessions"   value={active.length}     sub="Live right now"              color={C.success} />
        <Stat label="Active PROs"       value={pros.length}        sub="All centres"                color={C.info} />
        <Stat label="Venues Covered"    value={venues}             sub={`${(activities.length / Math.max(venues,1)).toFixed(1)} avg acts/venue`} color={C.warning} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* PRO Leaderboard */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>🏆 PRO Leaderboard</div>
            <div style={{ fontSize: 12, color: C.muted }}>All time · ranked by activities</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["#","PRO","Centre","Activities","Last Active"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600,
                    color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proStats.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>No PRO data yet</td></tr>
              ) : proStats.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: i < 3 ? BRAND : C.muted, fontSize: 14 }}>{i + 1}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{p.name}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#FDF2F7", color: BRAND, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{p.centre}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ height: 4, width: Math.max(4, Math.round((p.acts / Math.max(proStats[0]?.acts,1)) * 80)),
                        background: BRAND, borderRadius: 2 }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: BRAND }}>{p.acts}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: p.last ? C.success : C.muted, fontWeight: p.last ? 600 : 400 }}>
                    {daysAgo(p.last)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Activity type breakdown */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>By Activity Type</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>All time · visits</div>
          {typeRows.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>No activities yet</div>
          ) : typeRows.map(([type, val], i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{type}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{val.visits} visits</div>
              </div>
              <div style={{ background: C.border, borderRadius: 99, height: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.round((val.visits / maxVisits) * 100)}%`,
                  background: BRAND, height: "100%", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Live PRO Status */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14, color: C.text }}>
          🟢 Live PRO Status
        </div>
        {pros.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>No PRO users found</div>
        ) : pros.map((u, i) => {
          const sess = active.find(s => s.user_id === u.id);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 20px", borderBottom: i < pros.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{u.name || u.username}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{u.centre || "—"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {sess ? (
                  <>
                    <span style={{ background: C.successBg, color: C.success, borderRadius: 20,
                      padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 2 }}>● ACTIVE</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{sess.venue_name || "—"}</span>
                  </>
                ) : (
                  <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>Offline</span>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
