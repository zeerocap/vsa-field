import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty, Select } from "../../components/ui.jsx";
import { getSessions, getUsers } from "../../api/field.api.js";
import { getLiveSessions } from "../../api/field.api.js";

function fmt(dt) {
  return dt ? new Date(dt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—";
}
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
    Promise.all([getSessions({}), getLiveSessions(), getUsers()])
      .then(([completed, live, u]) => {
        const completedList = completed?.sessions || [];
        const liveList      = live?.sessions || [];
        // Merge: live first, then completed; deduplicate by id
        const seen = new Set();
        const merged = [...liveList, ...completedList].filter(s => {
          if (seen.has(s.id)) return false;
          seen.add(s.id); return true;
        });
        setSessions(merged);
        setUsers(u?.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pros     = users.filter(u => u.role === "pro");
  // filter uses pro_username
  const filtered = filter ? sessions.filter(s => s.pro_username === filter) : sessions;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>📍 Sessions</div>
        <Select value={filter} onChange={e => setFilter(e.target.value)}
          options={[
            { value: "", label: "All PROs" },
            ...pros.map(u => ({ value: u.username, label: u.name || u.username })),
          ]}
          style={{ width: 160 }} />
      </div>

      {filtered.length === 0 ? <Empty msg="No sessions found" icon="📍" /> : filtered.map((s, i) => {
        const isLive = !s.check_out_at;
        return (
          <Card key={s.id || i} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                {s.pro_username}
                {s.centre ? <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{s.centre}</span> : ""}
              </div>
              {isLive
                ? <span style={{ background: "#e8f5e9", color: "#388e3c", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>● LIVE</span>
                : <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Done</span>}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>📍 {s.venue_name || "Unknown venue"}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              In: {fmt(s.check_in_at)} → Out: {fmt(s.check_out_at)} · {elapsed(s.check_in_at, s.check_out_at)}
            </div>
            {s.trust_score != null && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Trust Score: {s.trust_score}/5</div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {s.flagged_fake_gps    && <span style={{ background: C.dangerBg,  color: C.danger,  borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Fake GPS</span>}
              {s.flagged_short_visit && <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Short Visit</span>}
              {s.is_auto_checkout    && <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>Auto-checkout</span>}
              {s.selfie_photo && (
                <img src={s.selfie_photo} alt="selfie" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", cursor: "pointer" }}
                  onClick={() => window.open(s.selfie_photo, "_blank")} />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
