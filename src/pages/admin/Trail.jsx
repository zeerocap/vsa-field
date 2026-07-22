import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Clock, Map, Route, Footprints, LocateFixed } from "lucide-react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";
import C from "../../constants/theme.js";
import {
  GMAP_KEY,
  TRAIL_MAP_OPTS,
  fmtDuration,
  fmtTime,
  getProTrailApi,
  getTrailSummaryApi,
  reverseGeocode,
} from "./_shared.jsx";

export default function TrailTab({ authUser, proMap, isMobile }) {
  // proMap is an array: [{ username, centre, acts, leads, lastDate }]
  const proList = (proMap || []).map((p) => p.username).sort();
  // lookup helper
  const proNameMap = useMemo(() => {
    const m = {};
    (proMap || []).forEach((p) => {
      m[p.username] = p;
    });
    return m;
  }, [proMap]);
  const todayStr = new Date().toLocaleDateString("en-CA");

  const [selPro, setSelPro] = useState(proList[0] || "");
  const [selDate, setSelDate] = useState(todayStr);
  const [summary, setSummary] = useState([]); // trail summary (which PROs have data)
  const [trailData, setTrailData] = useState(null); // { points, stops, trailDate, totalPoints }
  const [loading, setLoading] = useState(false);
  const [selStop, setSelStop] = useState(null); // clicked stop index
  const [placeNames, setPlaceNames] = useState({}); // stop index → place name
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GMAP_KEY, id: "vsa-gmap" });

  // Load summary when date changes
  useEffect(() => {
    if (!authUser?.token || !selDate) return;
    getTrailSummaryApi(authUser.token, { date: selDate }).then((r) => {
      if (r.ok) setSummary(r.summary || []);
    });
  }, [authUser?.token, selDate]);

  // Load trail when PRO or date changes
  const loadTrail = useCallback(async () => {
    if (!selPro || !selDate || !authUser?.token) return;
    setLoading(true);
    setTrailData(null);
    setSelStop(null);
    setPlaceNames({});
    const r = await getProTrailApi(authUser.token, { proUsername: selPro, date: selDate });
    if (r.ok) {
      setTrailData(r);
      // Kick off reverse geocoding for each stop (background)
      r.stops?.forEach((stop, i) => {
        reverseGeocode(stop.lat, stop.lng).then((name) => {
          setPlaceNames((prev) => ({ ...prev, [i]: name }));
        });
      });
    }
    setLoading(false);
  }, [selPro, selDate, authUser?.token]);

  useEffect(() => {
    loadTrail();
  }, [loadTrail]);

  const points = trailData?.points || [];
  const stops = trailData?.stops || [];
  const pathCoords = points.map((p) => ({ lat: p.lat, lng: p.lng }));

  // Centre of the route
  const mapCenter = useMemo(() => {
    if (points.length === 0) return { lat: 10.3, lng: 76.3 };
    const lats = points.map((p) => p.lat),
      lngs = points.map((p) => p.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [points]);

  // Pan map when stop is selected
  const panToStop = useCallback((stop, i) => {
    setSelStop(i);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: stop.lat, lng: stop.lng });
      mapRef.current.setZoom(16);
    }
  }, []);

  const proWithData = summary.map((s) => s.proUsername);

  return (
    <div>
      <style>{`
        .trail-timeline::-webkit-scrollbar { width:4px }
        .trail-timeline::-webkit-scrollbar-track { background:transparent }
        .trail-timeline::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:2px }
      `}</style>

      {/* ── Controls ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* PRO selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontSize: 11,
              color: C.muted,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
            }}
          >
            PRO
          </label>
          <select
            value={selPro}
            onChange={(e) => setSelPro(e.target.value)}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: C.text,
              background: C.card,
              fontFamily: "inherit",
              minWidth: 160,
              cursor: "pointer",
            }}
          >
            {proList.length === 0 && <option>No PROs</option>}
            {proList.map((p) => (
              <option key={p} value={p}>
                {p}
                {proWithData.includes(p) ? " *" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontSize: 11,
              color: C.muted,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
            }}
          >
            Date
          </label>
          <input
            type="date"
            value={selDate}
            onChange={(e) => setSelDate(e.target.value)}
            max={todayStr}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: C.text,
              background: C.card,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Stats chips */}
        {trailData && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <div
              style={{
                background: "#EFF6FF",
                borderRadius: 8,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LocateFixed size={13} color={C.info} />
              <span style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 600 }}>
                {trailData.totalPoints} GPS points
              </span>
            </div>
            <div
              style={{
                background: "#ECFDF5",
                borderRadius: 8,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Footprints size={13} color={C.success} />
              <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                {stops.length} stop{stops.length !== 1 ? "s" : ""}
              </span>
            </div>
            {points.length > 0 && (
              <div
                style={{
                  background: "#FFF7ED",
                  borderRadius: 8,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Clock size={13} color={C.warning} />
                <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>
                  {fmtTime(points[0]?.recordedAt)} –{" "}
                  {fmtTime(points[points.length - 1]?.recordedAt)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            color: C.muted,
            fontSize: 14,
            gap: 10,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              border: "2px solid rgba(0,0,0,0.1)",
              borderTopColor: C.brand,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Loading trail data…
        </div>
      )}

      {/* ── No data ── */}
      {!loading && trailData && points.length === 0 && (
        <div
          style={{
            background: C.card,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            padding: 48,
            textAlign: "center",
          }}
        >
          <Route size={32} color={C.muted} style={{ marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
            No trail data for this day
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, opacity: 0.7 }}>
            GPS tracking starts automatically when the PRO logs in on a device with location access.
          </div>
        </div>
      )}

      {/* ── Map + Timeline ── */}
      {!loading && points.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 0,
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${C.border}`,
            height: isMobile ? "auto" : 580,
            flexDirection: isMobile ? "column" : "row",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          {/* Map panel */}
          <div
            style={{ flex: 1, minWidth: 0, position: "relative", height: isMobile ? 300 : "100%" }}
          >
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={13}
                options={TRAIL_MAP_OPTS}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
              >
                {/* Blue route line */}
                <Polyline
                  path={pathCoords}
                  options={{
                    strokeColor: "#1A73E8",
                    strokeWeight: 4,
                    strokeOpacity: 0.85,
                    geodesic: true,
                  }}
                />

                {/* Start marker (green) */}
                {points[0] && (
                  <OverlayView
                    position={{ lat: points[0].lat, lng: points[0].lng }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      style={{
                        transform: "translate(-50%,-50%)",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: C.success,
                        border: "2px solid #fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }}
                      title="Start"
                    />
                  </OverlayView>
                )}

                {/* End marker (red) */}
                {points.length > 1 && (
                  <OverlayView
                    position={{
                      lat: points[points.length - 1].lat,
                      lng: points[points.length - 1].lng,
                    }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      style={{
                        transform: "translate(-50%,-50%)",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: C.danger,
                        border: "2px solid #fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }}
                      title="End"
                    />
                  </OverlayView>
                )}

                {/* Stop markers — numbered circles */}
                {stops.map((stop, i) => (
                  <OverlayView
                    key={i}
                    position={{ lat: stop.lat, lng: stop.lng }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      onClick={() => {
                        setSelStop(selStop === i ? null : i);
                      }}
                      style={{
                        transform: "translate(-50%,-50%)",
                        cursor: "pointer",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: selStop === i ? C.brand : "#1A73E8",
                        border: "2px solid #fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow:
                          selStop === i
                            ? `0 0 0 3px ${C.brand}40,0 2px 8px rgba(0,0,0,0.3)`
                            : "0 2px 8px rgba(0,0,0,0.3)",
                        transition: "all 0.15s",
                        zIndex: selStop === i ? 10 : 1,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                    </div>
                  </OverlayView>
                ))}

                {/* Popup for selected stop */}
                {selStop != null && stops[selStop] && (
                  <InfoWindow
                    position={{ lat: stops[selStop].lat, lng: stops[selStop].lng }}
                    onCloseClick={() => setSelStop(null)}
                  >
                    <div
                      style={{
                        fontFamily: "'Inter',-apple-system,sans-serif",
                        minWidth: 160,
                        maxWidth: 220,
                      }}
                    >
                      <div
                        style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 4 }}
                      >
                        Stop {selStop + 1}
                      </div>
                      <div
                        style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}
                      >
                        {placeNames[selStop] ||
                          `${stops[selStop].lat.toFixed(5)}, ${stops[selStop].lng.toFixed(5)}`}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            borderRadius: 6,
                            padding: "2px 7px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {fmtTime(stops[selStop].arrivedAt)} – {fmtTime(stops[selStop].leftAt)}
                        </span>
                        <span
                          style={{
                            background: "#ECFDF5",
                            color: "#166534",
                            borderRadius: 6,
                            padding: "2px 7px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {fmtDuration(stops[selStop].durationMin)}
                        </span>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: C.muted,
                }}
              >
                Loading map…
              </div>
            )}

            {/* Legend overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                background: "rgba(255,255,255,0.94)",
                borderRadius: 10,
                padding: "7px 12px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.12)",
                display: "flex",
                gap: 12,
                alignItems: "center",
                fontSize: 11,
                pointerEvents: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success }} />
                <span style={{ color: "#374151" }}>Start</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 24, height: 3, background: "#1A73E8", borderRadius: 2 }} />
                <span style={{ color: "#374151" }}>Route</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#1A73E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>N</span>
                </div>
                <span style={{ color: "#374151" }}>Stop</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.danger }} />
                <span style={{ color: "#374151" }}>End</span>
              </div>
            </div>
          </div>

          {/* Timeline sidebar */}
          <div
            className="trail-timeline"
            style={{
              width: isMobile ? "100%" : 280,
              flexShrink: 0,
              background: C.card,
              borderLeft: isMobile ? "none" : `1px solid ${C.border}`,
              borderTop: isMobile ? `1px solid ${C.border}` : "none",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Sidebar header */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${C.border}`,
                position: "sticky",
                top: 0,
                background: C.card,
                zIndex: 2,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{selPro}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {new Date(selDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>

            {/* Start event */}
            {points[0] && (
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${C.border}50`,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: C.success,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>
                    Tracking started
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                    {fmtTime(points[0].recordedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Stops */}
            {stops.map((stop, i) => (
              <div
                key={i}
                onClick={() => panToStop(stop, i)}
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${C.border}50`,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  background: selStop === i ? `${C.brand}08` : "transparent",
                  borderLeft: selStop === i ? `3px solid ${C.brand}` : "3px solid transparent",
                  transition: "all 0.12s",
                }}
              >
                {/* Stop number badge */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: selStop === i ? C.brand : "#1A73E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {placeNames[i] || "Locating…"}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {fmtTime(stop.arrivedAt)} – {fmtTime(stop.leftAt)}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span
                      style={{
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        borderRadius: 5,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {fmtDuration(stop.durationMin)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* End event */}
            {points.length > 0 && (
              <div
                style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: C.danger,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
                    Last recorded point
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                    {fmtTime(points[points.length - 1].recordedAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
