import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty, Select } from "../../components/ui.jsx";
import { getSessions, getUsers } from "../../api/field.api.js";

export default function AdminGallery() {
  const [sessions, setSessions] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [filter,   setFilter]   = useState("");
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getSessions({}), getUsers()])
      .then(([s, u]) => { setSessions(s?.sessions || s || []); setUsers(u?.users || u || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pros = users.filter(u => u.role === "pro");
  const withPhoto = (filter
    ? sessions.filter(s => String(s.user_id) === filter)
    : sessions
  ).filter(s => s.selfie_url);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>📸 Gallery</div>
        <Select value={filter} onChange={e => setFilter(e.target.value)}
          options={[{ value: "", label: "All PROs" }, ...pros.map(u => ({ value: String(u.id), label: u.name || u.username }))]}
          style={{ width: 150 }} />
      </div>

      {withPhoto.length === 0 ? <Empty msg="No check-in photos yet" icon="📸" /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {withPhoto.map((s, i) => (
            <div key={i} onClick={() => setPreview(s)} style={{ cursor: "pointer", borderRadius: 12, overflow: "hidden",
              background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <img src={s.selfie_url} alt="check-in" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.user_name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{new Date(s.checkin_time).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={preview.selfie_url} alt="selfie" style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 12, objectFit: "contain" }} />
          <div style={{ color: "#fff", marginTop: 12, fontSize: 14, fontWeight: 600 }}>{preview.user_name}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{preview.venue_name} · {new Date(preview.checkin_time).toLocaleString()}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8 }}>Tap anywhere to close</div>
        </div>
      )}
    </div>
  );
}
