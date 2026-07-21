import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty, Select } from "../../components/ui.jsx";
import { getSessions, getTrail, getUsers } from "../../api/field.api.js";

export default function AdminTrail() {
  const [sessions,   setSessions]   = useState([]);
  const [users,      setUsers]      = useState([]);
  const [selSession, setSelSession] = useState("");
  const [trail,      setTrail]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [trailLoad,  setTrailLoad]  = useState(false);

  useEffect(() => {
    Promise.all([getSessions({}), getUsers()])
      .then(([s, u]) => { setSessions(s?.sessions || []); setUsers(u?.users || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function loadTrail(sessionId) {
    setSelSession(sessionId); setTrailLoad(true);
    try {
      const r = await getTrail({ session_id: Number(sessionId) });
      setTrail(r?.trail || []);
    } catch { setTrail([]); } finally { setTrailLoad(false); }
  }

  if (loading) return <Spinner />;

  const pros = users.filter(u => u.role === "pro");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Location Trail</div>

      <Select value={selSession} onChange={e => loadTrail(e.target.value)}
        options={[{ value: "", label: "— Select a session —" },
          ...sessions.map(s => ({ value: String(s.id), label: `${s.user_name} · ${new Date(s.checkin_time).toLocaleDateString()} · ${s.venue_name || "?"}` }))]} />

      {trailLoad && <Spinner />}

      {!trailLoad && selSession && (
        trail.length === 0 ? <Empty msg="No trail data for this session" icon="route" /> : (
          <>
            <div style={{ fontSize: 13, color: C.muted }}>{trail.length} GPS points recorded</div>
            {trail.length > 0 && (
              <a href={`https://maps.google.com/?q=${trail[0].lat},${trail[0].lng}`} target="_blank"
                style={{ background: C.accent, color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 600, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                View Start on Google Maps ↗
              </a>
            )}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {trail.map((pt, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px",
                  borderBottom: i < trail.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontSize: 12, color: C.text }}>
                    {pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}
                    {pt.accuracy && <span style={{ color: C.muted }}> ± {Math.round(pt.accuracy)}m</span>}
                  </div>
                  <a href={`https://maps.google.com/?q=${pt.lat},${pt.lng}`} target="_blank"
                    style={{ fontSize: 11, color: C.accent, textDecoration: "none" }}>
                    {new Date(pt.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ↗
                  </a>
                </div>
              ))}
            </Card>
          </>
        )
      )}
    </div>
  );
}
