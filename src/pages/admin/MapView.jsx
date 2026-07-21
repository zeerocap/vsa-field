import { useState, useEffect, useMemo } from "react";
import C from "../../constants/theme.js";
import { Spinner } from "../../components/ui.jsx";
import { getActivities } from "../../api/field.api.js";
import Icon from "../../components/Icons.jsx";

const KERALA_DISTRICTS = [
  "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam",
  "Idukki","Ernakulam","Thrissur","Palakkad","Malappuram",
  "Kozhikode","Wayanad","Kannur","Kasaragod",
];

function heatColor(acts, maxActs) {
  if (!acts) return "#E5E7EB";
  const t = acts / maxActs;
  if (t < 0.15) return "#FBE8F2";
  if (t < 0.35) return "#E8A0C4";
  if (t < 0.6)  return "#C45B92";
  if (t < 0.8)  return "#9e2462";
  return C.brand;
}
function heatText(acts, maxActs) {
  if (!acts) return C.muted;
  const t = acts / maxActs;
  return t < 0.15 ? C.brand : "#fff";
}

export default function AdminMapView() {
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [filterPro,  setFilterPro]  = useState("");

  useEffect(() => {
    getActivities({})
      .then(r => setActivities(r?.activities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Aggregate per district
  const byDistrict = useMemo(() => {
    const m = {};
    activities.forEach(a => {
      if (!a.district) return;
      if (!m[a.district]) m[a.district] = { acts: 0, leads: 0, pros: new Set(), venues: new Set() };
      m[a.district].acts++;
      m[a.district].leads += (a.leads_captured || 0);
      m[a.district].pros.add(a.pro_username);
      m[a.district].venues.add(a.venue_name);
    });
    return m;
  }, [activities]);

  const maxActs         = useMemo(() => Math.max(...Object.values(byDistrict).map(d => d.acts), 1), [byDistrict]);
  const totalLeadsAll   = useMemo(() => activities.reduce((s, a) => s + (a.leads_captured || 0), 0), [activities]);
  const venuesCovered   = useMemo(() => new Set(activities.map(a => a.venue_name).filter(Boolean)).size, [activities]);

  // Drill-down
  const distActs = selected
    ? activities.filter(a => a.district === selected && (!filterPro || a.pro_username === filterPro))
    : [];

  const venueBreakdown = {};
  distActs.forEach(a => {
    const vn = a.venue_name || "Unknown";
    if (!venueBreakdown[vn]) venueBreakdown[vn] = { leads: 0, acts: 0, pros: new Set() };
    venueBreakdown[vn].acts++;
    venueBreakdown[vn].leads += (a.leads_captured || 0);
    venueBreakdown[vn].pros.add(a.pro_username);
  });

  const proBreakdown = {};
  distActs.forEach(a => {
    const p = a.pro_username || "Unknown";
    if (!proBreakdown[p]) proBreakdown[p] = { leads: 0, acts: 0 };
    proBreakdown[p].acts++;
    proBreakdown[p].leads += (a.leads_captured || 0);
  });

  const selInfo = selected ? byDistrict[selected] : null;

  if (loading) return <Spinner />;

  return (
    <div>
      <style>{`@keyframes _mapfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}._mapcard{animation:_mapfade .3s ease both}`}</style>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Active Districts", value: `${Object.keys(byDistrict).length}/14`, color: C.brand },
          { label: "Total Activities", value: activities.length,                      color: C.info  },
          { label: "Total Leads",      value: totalLeadsAll,                          color: C.success },
          { label: "Venues Covered",   value: venuesCovered,                          color: C.warning },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 14px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Activity Heatmap — Kerala</div>
            <div style={{ fontSize: 10, color: C.muted }}>Tap a district to drill down</div>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {["#E5E7EB", "#FBE8F2", "#E8A0C4", "#C45B92", C.brand].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 9, color: C.muted, marginLeft: 2 }}>Low→High</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 7 }}>
          {KERALA_DISTRICTS.map(d => {
            const info    = byDistrict[d];
            const acts    = info?.acts || 0;
            const col     = heatColor(acts, maxActs);
            const txtCol  = heatText(acts, maxActs);
            const isSel   = selected === d;
            return (
              <div key={d}
                onClick={() => setSelected(isSel ? null : d)}
                style={{
                  background: col, borderRadius: 10, padding: "10px 12px",
                  cursor: "pointer", border: `2px solid ${isSel ? C.brand : "transparent"}`,
                  boxShadow: isSel ? `0 0 0 3px ${C.brand}30` : "none",
                  transition: "all .15s",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: isSel ? 800 : 600, color: txtCol || (acts ? "#fff" : C.text) }}>
                    {d.length > 14 ? d.slice(0, 13) + "…" : d}
                  </div>
                  {acts > 0 && (
                    <div style={{ fontSize: 10, color: acts ? "rgba(255,255,255,0.8)" : C.muted, marginTop: 1 }}>
                      {(info?.leads || 0)} leads
                    </div>
                  )}
                </div>
                <div style={{ fontSize: acts > 0 ? 18 : 13, fontWeight: 800, color: acts ? (txtCol || "#fff") : C.faint }}>
                  {acts > 0 ? acts : "—"}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: C.faint, marginTop: 10 }}>
          {Object.keys(byDistrict).length} active districts · {activities.length} total activities
        </div>
      </div>

      {/* Detail Panel */}
      {!selected ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.brand}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Icon name="map" size={22} color={C.brand} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 5 }}>Select a district</div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Darker tiles = more activity. Tap any district to see the full breakdown.
          </div>
        </div>
      ) : (
        <div className="_mapcard" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* District header */}
          <div style={{ background: "linear-gradient(135deg,#FBE8F2,#FDF2F7)", border: `1.5px solid ${C.brand}30`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>{selected}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                  {selInfo?.acts || 0} activities · {selInfo?.pros?.size || 0} PROs · {selInfo?.venues?.size || 0} venues
                </div>
              </div>
              <button onClick={() => { setSelected(null); setFilterPro(""); }}
                style={{ border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.8)", color: C.muted, borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <Icon name="x" size={11} color={C.muted} /> Clear
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Activities", value: selInfo?.acts || 0 },
                { label: "Leads",      value: selInfo?.leads || 0 },
                { label: "PROs",       value: selInfo?.pros?.size || 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.85)", borderRadius: 9, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRO breakdown */}
          {Object.keys(proBreakdown).length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>PRO Filter:</span>
                <select value={filterPro} onChange={e => setFilterPro(e.target.value)}
                  style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, background: C.card, fontFamily: "inherit", outline: "none" }}>
                  <option value="">All PROs</option>
                  {selInfo && [...selInfo.pros].sort().map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(proBreakdown).sort(([, a], [, b]) => b.leads - a.leads).map(([pro, info]) => {
                  const maxPA = Math.max(...Object.values(proBreakdown).map(p => p.acts), 1);
                  const pct   = Math.round((info.acts / maxPA) * 100);
                  return (
                    <div key={pro} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.brand}15`, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand, fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                        {pro.slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pro}</span>
                          <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", marginLeft: 8 }}>
                            {info.acts} visit{info.acts !== 1 ? "s" : ""} · <strong style={{ color: C.brand }}>{info.leads}</strong> leads
                          </span>
                        </div>
                        <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: C.brand, borderRadius: 2, transition: "width .5s" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Venue breakdown */}
          {Object.keys(venueBreakdown).length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
              No activities in {selected}{filterPro ? ` by ${filterPro}` : ""}.
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Venues in {selected}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{Object.keys(venueBreakdown).length} venue{Object.keys(venueBreakdown).length !== 1 ? "s" : ""}</span>
              </div>
              {Object.entries(venueBreakdown).sort(([, a], [, b]) => b.acts - a.acts).map(([vname, info], i, arr) => {
                const maxVA = Math.max(...Object.values(venueBreakdown).map(v => v.acts), 1);
                const pct   = Math.round((info.acts / maxVA) * 100);
                return (
                  <div key={i} style={{ padding: "13px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vname}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                          {info.acts} visit{info.acts !== 1 ? "s" : ""} · {info.pros.size} PRO{info.pros.size !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.brand }}>{info.leads}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>leads</div>
                      </div>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: C.brand, borderRadius: 2, transition: "width .5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
