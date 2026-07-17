import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty, Select } from "../../components/ui.jsx";
import { getSessions, getVenues, getUsers } from "../../api/field.api.js";

export default function AdminMapView() {
  const [sessions, setSessions] = useState([]);
  const [venues,   setVenues]   = useState([]);
  const [users,    setUsers]    = useState([]);
  const [filter,   setFilter]   = useState("active");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getSessions({}), getVenues(), getUsers()])
      .then(([s, v, u]) => { setSessions(s?.sessions || s || []); setVenues(v?.venues || v || []); setUsers(u?.users || u || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const active = sessions.filter(s => !s.checkout_time);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>🗺️ Map View</div>

      {/* Active PROs */}
      <Card>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>
          🟢 Active PROs ({active.length})
        </div>
        {active.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>No active check-ins right now</div>
        ) : active.map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < active.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{s.user_name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>📍 {s.venue_name || "Unknown"}</div>
            </div>
            {s.checkin_lat && s.checkin_lng && (
              <a href={`https://maps.google.com/?q=${s.checkin_lat},${s.checkin_lng}`} target="_blank"
                style={{ background: C.accent, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                View
              </a>
            )}
          </div>
        ))}
      </Card>

      {/* Venue List */}
      <Card>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>
          📍 All Venues ({venues.length})
        </div>
        {venues.length === 0 ? <Empty msg="No venues added" icon="📍" /> : venues.map((v, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < venues.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{v.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{v.address || "No address"} · {v.type || "Venue"}</div>
            </div>
            {v.lat && v.lng && (
              <a href={`https://maps.google.com/?q=${v.lat},${v.lng}`} target="_blank"
                style={{ color: C.accent, fontSize: 12, textDecoration: "none" }}>Map ↗</a>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
