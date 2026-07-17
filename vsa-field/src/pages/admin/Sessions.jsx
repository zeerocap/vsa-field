import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty, Select } from "../../components/ui.jsx";
import { getSessions, getUsers } from "../../api/field.api.js";

function fmt(dt) { return dt ? new Date(dt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"; }
function elapsed(cin, cout) {
  if (!cin) return "—";
  const ms = (cout ? new Date(cout) : new Date()) - new Date(cin);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [filter,   setFilter]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getSessions({}), getUsers()])
      .then(([s, u]) => { setSessions(s?.sessions || s || []); setUsers(u?.users || u || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pros     = users.filter(u => u.role === "pro");
  const filtered = filter ? sessions.filter(s => String(s.user_id) === filter) : sessions;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>📍 Sessions</div>
        <Select value={filter} onChange={e => setFilter(e.target.value)}
          options={[{ value: "", label: "All PROs" }, ...pros.map(u => ({ value: String(u.id), label: u.name || u.username }))]}
          style={{ width: 160 }} />
      </div>

      {filtered.length === 0 ? <Empty msg="No sessions found" icon="📍" /> : filtered.map((s, i) => (
        <Card key={i} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s.user_name || `User #${s.user_id}`}</div>
            {!s.checkout_time
              ? <span style={{ background: "#e8f5e9", color: "#388e3c", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>● LIVE</span>
              : <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Done</span>}
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>📍 {s.venue_name || "Unknown venue"}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            In: {fmt(s.checkin_time)} → Out: {fmt(s.checkout_time)} · {elapsed(s.checkin_time, s.checkout_time)}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {s.late_flag         && <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Late</span>}
            {s.short_visit_flag  && <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Short Visit</span>}
            {s.fake_gps_flag     && <span style={{ background: C.dangerBg,  color: C.danger,  borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Fake GPS</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}
