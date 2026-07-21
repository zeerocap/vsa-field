import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Spinner, Empty } from "../../components/ui.jsx";
import { getSessions, getLiveSessions, getUsers } from "../../api/field.api.js";

export default function AdminGallery() {
  const [sessions, setSessions] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [filter,   setFilter]   = useState("");
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getSessions({}), getLiveSessions(), getUsers()])
      .then(([completed, live, u]) => {
        const comp = completed?.sessions || [];
        const lv   = live?.sessions || [];
        const liveIds = new Set(lv.map(s => s.id));
        const merged  = [...lv, ...comp.filter(s => !liveIds.has(s.id))];
        setSessions(merged);
        setUsers(u?.users || []);
      })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pros = users.filter(u => u.role === "pro");
  const withPhoto = (filter
    ? sessions.filter(s => s.pro_username === filter)
    : sessions
  ).filter(s => s.selfie_photo);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 22, color: C.text }}>Gallery</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{withPhoto.length} check-in photos</div>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8,
            fontSize: 13, background: C.card, color: C.text, outline: "none", width: 150 }}>
          <option value="">All PROs</option>
          {pros.map(u => <option key={u.id} value={u.username}>{u.name || u.username}</option>)}
        </select>
      </div>

      {withPhoto.length === 0 ? (
        <Empty msg="No check-in photos yet" icon="camera" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {withPhoto.map((s, i) => (
            <div key={i} onClick={() => setPreview(s)}
              style={{ cursor: "pointer", borderRadius: 12, overflow: "hidden",
                background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow,
                transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = C.shadow; }}>
              <img src={s.selfie_photo} alt="check-in"
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.pro_username || "—"}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  {s.check_in_at ? new Date(s.check_in_at).toLocaleDateString() : "—"}
                </div>
                {s.venue_name && (
                  <div style={{ fontSize: 10, color: C.muted, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {s.venue_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 999,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={preview.selfie_photo} alt="selfie"
            style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 12, objectFit: "contain" }} />
          <div style={{ color: "#fff", marginTop: 14, fontSize: 16, fontWeight: 700 }}>
            {preview.pro_username}
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>
            {preview.venue_name} · {preview.check_in_at ? new Date(preview.check_in_at).toLocaleString() : ""}
          </div>
          {preview.trust_score != null && (
            <div style={{ marginTop: 8, background: "rgba(255,255,255,0.15)", color: "#fff",
              borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
              Trust Score: {preview.trust_score}%
            </div>
          )}
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 12 }}>
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}
