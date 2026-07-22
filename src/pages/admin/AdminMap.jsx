import { useState, useMemo } from "react";
import { X, Activity, Filter, Map } from "lucide-react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import C from "../../constants/theme.js";
import { GMAP_KEY, GMAP_OPTIONS, KERALA_DISTRICT_CENTERS } from "./_shared.jsx";

export default function AdminMapTab({ activities, isMobile }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [filterPro, setFilterPro] = useState("");
  const { isLoaded: gmapLoaded } = useJsApiLoader({ googleMapsApiKey: GMAP_KEY, id: "vsa-gmap" });

  // Aggregate per district (memoized)
  const byDistrict = useMemo(() => {
    const m = {};
    activities.forEach((a) => {
      if (!a.district) return;
      if (!m[a.district]) m[a.district] = { acts: 0, leads: 0, pros: new Set(), venues: new Set() };
      m[a.district].acts++;
      m[a.district].leads += a.leads_captured || 0;
      m[a.district].pros.add(a.pro_username);
      m[a.district].venues.add(a.venue_name);
    });
    return m;
  }, [activities]);

  const maxActs = useMemo(
    () => Math.max(...Object.values(byDistrict).map((d) => d.acts), 1),
    [byDistrict]
  );
  const totalLeadsAll = useMemo(
    () => activities.reduce((s, a) => s + (a.leads_captured || 0), 0),
    [activities]
  );
  const venuesCoveredAll = useMemo(
    () => new Set(activities.map((a) => a.venue_name).filter(Boolean)).size,
    [activities]
  );

  const heatColor = (d) => {
    const info = byDistrict[d];
    if (!info || !info.acts) return "#E5E7EB";
    const t = info.acts / maxActs;
    if (t < 0.15) return "#EDE9FE";
    if (t < 0.35) return "#C4B5FD";
    if (t < 0.6) return "#A78BFA";
    if (t < 0.8) return C.purple;
    return "#5B21B6";
  };
  const dotRadius = (d) => {
    const info = byDistrict[d];
    if (!info) return 7;
    return Math.min(22, 9 + info.acts * 0.7);
  };

  // District drill-down
  const distActs = selected
    ? activities.filter(
        (a) => a.district === selected && (!filterPro || a.pro_username === filterPro)
      )
    : [];

  const venueBreakdown = {};
  distActs.forEach((a) => {
    const vn = a.venue_name || "Unknown";
    if (!venueBreakdown[vn]) venueBreakdown[vn] = { leads: 0, acts: 0, pros: new Set() };
    venueBreakdown[vn].acts++;
    venueBreakdown[vn].leads += a.leads_captured || 0;
    venueBreakdown[vn].pros.add(a.pro_username);
  });

  const proBreakdown = {};
  distActs.forEach((a) => {
    const p = a.pro_username || "Unknown";
    if (!proBreakdown[p]) proBreakdown[p] = { leads: 0, acts: 0 };
    proBreakdown[p].acts++;
    proBreakdown[p].leads += a.leads_captured || 0;
  });

  const selInfo = selected ? byDistrict[selected] : null;

  return (
    <div>
      <style>{`@keyframes _admpulse{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:.07;transform:scale(1.7)}}@keyframes _admfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}._admcard{animation:_admfade .3s ease both}`}</style>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: "Active Districts",
            value: `${Object.keys(byDistrict).length}/14`,
            color: C.brand,
          },
          { label: "Total Activities", value: activities.length, color: C.info },
          { label: "Total Leads", value: totalLeadsAll, color: C.success },
          { label: "Venues Covered", value: venuesCoveredAll, color: C.warning },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".05em",
                marginBottom: 3,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* SVG Map */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "18px 16px 12px",
            flexShrink: 0,
            width: isMobile ? "100%" : 285,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Activity Heatmap</div>
              <div style={{ fontSize: 10, color: C.muted }}>Tap district to drill down</div>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {["#E5E7EB", "#C4B5FD", "#A78BFA", "#5B21B6"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              ))}
              <span style={{ fontSize: 9, color: C.muted, marginLeft: 2 }}>Low→High</span>
            </div>
          </div>

          {gmapLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: isMobile ? 270 : 420, borderRadius: 8 }}
              center={{ lat: 10.3, lng: 76.3 }}
              zoom={isMobile ? 6 : 7}
              options={{ ...GMAP_OPTIONS, zoomControl: true, fullscreenControl: false }}
              onClick={() => setSelected(null)}
            >
              {Object.entries(KERALA_DISTRICT_CENTERS).map(([name, pos]) => {
                const info = byDistrict[name];
                const col = heatColor(name);
                const sz = dotRadius(name);
                const isSel = selected === name;
                const px = sz * 2 + 4;
                return (
                  <OverlayView
                    key={name}
                    position={pos}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(isSel ? null : name);
                      }}
                      style={{
                        position: "relative",
                        transform: `translate(-${px / 2}px,-${px / 2}px)`,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      {/* Pulse ring when selected */}
                      {isSel && (
                        <div
                          style={{
                            position: "absolute",
                            inset: -8,
                            borderRadius: "50%",
                            background: col,
                            animation: "_admpulse 2.2s ease-in-out infinite",
                          }}
                        />
                      )}
                      {/* Main bubble */}
                      <div
                        style={{
                          width: px,
                          height: px,
                          borderRadius: "50%",
                          background: col,
                          opacity: info?.acts ? 0.9 : 0.35,
                          border: `${isSel ? 2.5 : 1.5}px solid ${isSel ? C.purple : col + "90"}`,
                          boxShadow: isSel
                            ? `0 0 0 4px ${col}30, 0 3px 10px rgba(0,0,0,0.2)`
                            : "0 2px 6px rgba(0,0,0,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all .2s",
                          position: "relative",
                        }}
                      >
                        {info?.acts > 0 && (
                          <span
                            style={{
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: px > 28 ? 10 : 8,
                              lineHeight: 1,
                            }}
                          >
                            {info.acts}
                          </span>
                        )}
                      </div>
                      {/* District label */}
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          fontSize: isSel ? 9 : 8,
                          fontWeight: isSel ? 700 : 500,
                          color: isSel ? C.purple : C.muted,
                          textShadow: "0 1px 2px rgba(255,255,255,0.9)",
                          pointerEvents: "none",
                        }}
                      >
                        {name.length > 11 ? name.slice(0, 10) + "…" : name}
                      </div>
                    </div>
                  </OverlayView>
                );
              })}
            </GoogleMap>
          ) : (
            <div
              style={{
                height: isMobile ? 270 : 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.muted,
                fontSize: 13,
                borderRadius: 8,
                background: C.bg,
              }}
            >
              Loading map…
            </div>
          )}
          <div style={{ textAlign: "center", fontSize: 11, color: C.faint, marginTop: 6 }}>
            {Object.keys(byDistrict).length} active districts · {activities.length} total activities
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selected ? (
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "52px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${C.brand}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Map size={26} color={C.brand} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>
                Select a district
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Darker nodes = more activity. Tap any district to see the full breakdown.
              </div>
            </div>
          ) : (
            <div className="_admcard" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Header */}
              <div
                style={{
                  background: "linear-gradient(135deg,#EDE9FE,#F8FAFC)",
                  border: "1.5px solid #A78BFA40",
                  borderRadius: 16,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: C.text }}>{selected}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                      {selInfo?.acts || 0} activities · {selInfo?.pros?.size || 0} PROs ·{" "}
                      {selInfo?.venues?.size || 0} venues
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setFilterPro("");
                    }}
                    style={{
                      border: `1px solid ${C.border}`,
                      background: "rgba(255,255,255,0.8)",
                      color: C.muted,
                      borderRadius: 8,
                      padding: "5px 10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 11,
                    }}
                  >
                    <X size={11} /> Clear
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    { label: "Activities", value: selInfo?.acts || 0 },
                    { label: "Leads", value: selInfo?.leads || 0 },
                    { label: "PROs", value: selInfo?.pros?.size || 0 },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        background: "rgba(255,255,255,0.8)",
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: C.muted,
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginTop: 2 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRO filter + breakdown */}
              {Object.keys(proBreakdown).length > 0 && (
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                      PRO Filter:
                    </span>
                    <select
                      value={filterPro}
                      onChange={(e) => setFilterPro(e.target.value)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 12,
                        color: C.text,
                        background: C.card,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    >
                      <option value="">All PROs</option>
                      {[...selInfo.pros].sort().map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(proBreakdown)
                      .sort(([, a], [, b]) => b.leads - a.leads)
                      .map(([pro, info]) => {
                        const maxProActs = Math.max(
                          ...Object.values(proBreakdown).map((p) => p.acts),
                          1
                        );
                        const pct = Math.round((info.acts / maxProActs) * 100);
                        return (
                          <div key={pro} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: `${C.brand}15`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: C.brand,
                                fontWeight: 800,
                                fontSize: 11,
                                flexShrink: 0,
                              }}
                            >
                              {pro.slice(0, 1).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 3,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: C.text,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {pro}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: C.muted,
                                    whiteSpace: "nowrap",
                                    marginLeft: 8,
                                  }}
                                >
                                  {info.acts} visit{info.acts !== 1 ? "s" : ""} ·{" "}
                                  <strong style={{ color: C.brand }}>{info.leads}</strong> leads
                                </span>
                              </div>
                              <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: C.brand,
                                    borderRadius: 2,
                                    transition: "width .5s",
                                  }}
                                />
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
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "32px 24px",
                    textAlign: "center",
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  No activities in {selected}
                  {filterPro ? ` by ${filterPro}` : ""}.
                </div>
              ) : (
                <div
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 18px",
                      borderBottom: `1px solid ${C.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                      Venues in {selected}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {Object.keys(venueBreakdown).length} venue
                      {Object.keys(venueBreakdown).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {Object.entries(venueBreakdown)
                    .sort(([, a], [, b]) => b.acts - a.acts)
                    .map(([vname, info], i, arr) => {
                      const maxVA = Math.max(
                        ...Object.values(venueBreakdown).map((v) => v.acts),
                        1
                      );
                      const pct = Math.round((info.acts / maxVA) * 100);
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "13px 18px",
                            borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                            transition: "background .12s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: C.text,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {vname}
                              </div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                                {info.acts} visit{info.acts !== 1 ? "s" : ""} · {info.pros.size} PRO
                                {info.pros.size !== 1 ? "s" : ""}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: C.brand }}>
                                {info.leads}
                              </div>
                              <div style={{ fontSize: 9, color: C.muted }}>leads</div>
                            </div>
                          </div>
                          <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: C.brand,
                                borderRadius: 2,
                                transition: "width .5s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
