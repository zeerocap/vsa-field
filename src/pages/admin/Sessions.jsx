import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getSessions, getLiveSessions, getUsers } from "../../api/field.api.js";

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
        const comp = completed?.sessions || [];
        const lv   = live?.sessions || [];
        // Merge — live sessions take priority, deduplicate by id
        const liveIds = new Set(lv.map(s => s.id));
        const merged  = [...lv, ...comp.filter(s => !liveIds.has(s.id))];
        setSessions(merged);
        setUsers(u?.users || []);
      })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pros     = users.filter(u => u.role === "pro");
  const filtered = filter
    ? sessions.filter(s => s.pro_username === filter)
    : sessions;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 22, color: C.text }}>Sessions</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{filtered.length} records</div>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8,
            fontSize: 13, background: C.card, color: C.text, outline: "none", width: 150 }}>
          <option value="">All PROs</option>
          {pros.map(u => <option key={u.id} value={u.username}>{u.name || u.username}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? <Empty msg="No sessions found" icon="mappin" /> : filtered.map((s, i) => {
        const isLive = !s.check_out_at;
        return (
          <Card key={s.id || i} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>
                  {s.pro_username || "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.muted }}>
                  <Icon name="mappin" size={12} color={C.muted} />
                  {s.venue_name || "Unknown venue"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {isLive ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, background: C.successBg,
                    color: C.success, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block" }} />
                    LIVE
                  </span>
                ) : (
                  <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>
                    Done
                  </span>
                )}
                {s.is_auto_checkout && (
                  <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20,
                    padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>Auto-checkout</span>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>CHECK-IN</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmt(s.check_in_at)}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>CHECK-OUT</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmt(s.check_out_at)}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>DURATION</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{elapsed(s.check_in_at, s.check_out_at)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {s.trust_score != null && (
                <span style={{ background: C.infoBg, color: C.info, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                  Trust {s.trust_score}%
                </span>
              )}
              {s.flagged_short_visit && (
                <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Short Visit</span>
              )}
              {s.flagged_fake_gps && (
                <span style={{ background: C.dangerBg, color: C.danger, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Fake GPS</span>
              )}
              {s.selfie_photo && (
                <img src={s.selfie_photo} alt="selfie"
                  style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover",
                    border: `2px solid ${C.border}`, marginLeft: "auto" }} />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
