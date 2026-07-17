import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Btn } from "../../components/ui.jsx";
import { getVenues } from "../../api/field.api.js";

const TYPE_COLORS = {
  school:    { color: C.brand,   bg: C.brandBg },
  college:   { color: C.info,    bg: C.infoBg },
  coaching:  { color: C.success, bg: C.successBg },
  corporate: { color: C.warning, bg: C.warningBg },
  other:     { color: C.muted,   bg: C.bg },
};
const REL_COLOR = { active: C.success, warm: "#F59E0B", new: C.info, cold: C.muted };

function pill(label, color) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: color + "22", color, textTransform: "capitalize" }}>{label}</span>;
}

function timeAgo(d) {
  if (!d) return "Never";
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ProVenues() {
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [type,    setType]    = useState("");

  useEffect(() => {
    getVenues().then(r => setVenues(r.venues || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const filtered = venues.filter(v =>
    (!search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.district?.toLowerCase().includes(search.toLowerCase())) &&
    (!type   || v.venue_type === type)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>My Venues</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{filtered.length} venue{filtered.length !== 1 ? "s" : ""} in your territory</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search venues..."
          style={{ flex: 1, padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.card, color: C.text, outline: "none" }} />
        <select value={type} onChange={e => setType(e.target.value)}
          style={{ padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.card, color: C.text, outline: "none" }}>
          <option value="">All Types</option>
          <option value="school">School</option>
          <option value="college">College</option>
          <option value="coaching">Coaching</option>
          <option value="corporate">Corporate</option>
          <option value="other">Other</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No venues found</div>
        </Card>
      ) : filtered.map(v => {
        const tc = TYPE_COLORS[v.venue_type] || TYPE_COLORS.other;
        const rc = REL_COLOR[v.relationship_status] || C.muted;
        return (
          <Card key={v.id} style={{ padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {pill(v.venue_type || "other", tc.color)}
                  {pill(v.relationship_status || "new", rc)}
                  {v.district && <span style={{ fontSize: 11, color: C.muted }}>📍 {v.district}</span>}
                </div>
              </div>
              <Btn size="sm" onClick={() => {
                const q = encodeURIComponent(v.address || `${v.name} ${v.district || ""}`);
                window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
              }} style={{ background: C.brand, color: "#fff", border: "none", whiteSpace: "nowrap" }}>
                🗺️ Navigate
              </Btn>
            </div>
            <div style={{ display: "flex", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ flex: 1, padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.brand }}>{v.total_visits || 0}</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>VISITS</div>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.success }}>{v.total_leads || 0}</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>LEADS</div>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.info }}>{timeAgo(v.last_visited_at)}</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>LAST VISIT</div>
              </div>
            </div>
            {(v.contact_name || v.contact_phone) && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: C.brandBg, borderRadius: 8, fontSize: 12, color: C.brand, display: "flex", alignItems: "center", gap: 8 }}>
                <span>👤</span>
                <span style={{ fontWeight: 600 }}>{v.contact_name}</span>
                {v.contact_phone && <a href={`tel:${v.contact_phone}`} style={{ color: C.brand, marginLeft: "auto", fontWeight: 700 }}>📞 {v.contact_phone}</a>}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
