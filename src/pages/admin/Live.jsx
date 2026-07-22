import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Camera, Map } from "lucide-react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import C from "../../constants/theme.js";
import { GMAP_KEY, GMAP_OPTIONS, getLiveSessionsApi } from "./_shared.jsx";
import ProMarker from "./ProMarker.jsx";

export default function LiveTab({ authUser, isMobile }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("map"); // "map" | "cards"
  const [selected, setSelected] = useState(null);
  const [tick, setTick] = useState(0);
  const mapRef = useRef(null);

  const { isLoaded: gmapLoaded } = useJsApiLoader({
    googleMapsApiKey: GMAP_KEY,
    id: "vsa-gmap",
  });

  const load = async (manual = false) => {
    if (manual) setRefreshing(true);
    const r = await getLiveSessionsApi(authUser.token);
    if (r.ok) setSessions(r.sessions || []);
    setLoading(false);
    setRefreshing(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [authUser.token]);
  useEffect(() => {
    const t = setInterval(() => setTick((k) => k + 1), 10000);
    return () => clearInterval(t);
  }, []);

  // Auto-fit bounds when map loads or sessions change
  const fitBounds = useCallback(
    (map) => {
      if (!map) return;
      const pts = sessions.filter((s) => s.lat && s.lng);
      if (pts.length === 0) {
        map.setCenter({ lat: 10.8505, lng: 76.2711 });
        map.setZoom(8);
      } else if (pts.length === 1) {
        map.setCenter({ lat: pts[0].lat, lng: pts[0].lng });
        map.setZoom(14);
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        pts.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
        map.fitBounds(bounds, 60);
      }
    },
    [sessions]
  );

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      fitBounds(map);
    },
    [fitBounds]
  );

  useEffect(() => {
    fitBounds(mapRef.current);
  }, [sessions]);

  const elapsed = (at) => {
    const m = Math.floor((Date.now() - new Date(at)) / 60000);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };
  const fmtRefresh = () => {
    if (!lastRefresh) return "";
    const s = Math.floor((Date.now() - lastRefresh) / 1000);
    return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
  };

  const gpsCount = sessions.filter((s) => s.lat && s.lng).length;
  const selSession = sessions.find((s) => s.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes _lpulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.5} }
        @keyframes _spin    { to { transform:rotate(360deg); } }
        .gm-style-iw { padding:0 !important; border-radius:14px !important; overflow:hidden !important; }
        .gm-style-iw-d { overflow:hidden !important; padding:0 !important; }
        .gm-style-iw-c { padding:0 !important; border-radius:14px !important; box-shadow:0 8px 32px rgba(0,0,0,0.18) !important; }
        .gm-style-iw-tc::after { display:none; }
        button.gm-ui-hover-effect { top:4px !important; right:4px !important; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: C.success,
              animation: "_lpulse 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>
            {sessions.length > 0
              ? `${sessions.length} PRO${sessions.length > 1 ? "s" : ""} Active`
              : "Live Tracker"}
          </span>
          {gpsCount > 0 && (
            <span style={{ fontSize: 11, color: C.muted }}>· {gpsCount} on map</span>
          )}
          {lastRefresh && <span style={{ fontSize: 11, color: C.faint }}>· {fmtRefresh()}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* View toggle */}
          <div
            style={{
              display: "flex",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {["map", "cards"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  background: view === v ? C.brand : C.card,
                  color: view === v ? "#fff" : C.muted,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "capitalize",
                }}
              >
                {v === "map" ? "Map" : "Cards"}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              background: C.card,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              color: C.muted,
              fontWeight: 600,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ animation: refreshing ? "_spin .8s linear infinite" : "none" }}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: C.muted, fontSize: 13 }}>
          Loading…
        </div>
      ) : sessions.length === 0 ? (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <MapPin size={36} color={C.muted} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>
            No active visits right now
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            PROs appear here when they check in from the Field Tracker app.
          </div>
        </div>
      ) : view === "map" ? (
        /* ── MAP VIEW ── */
        <div style={{ display: "flex", gap: 14, flexDirection: isMobile ? "column" : "row" }}>
          {/* Google Map */}
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
              minHeight: 480,
            }}
          >
            {gmapLoaded ? (
              <GoogleMap
                mapContainerStyle={{ height: isMobile ? 340 : 520, width: "100%" }}
                center={{ lat: 10.8505, lng: 76.2711 }}
                zoom={8}
                options={GMAP_OPTIONS}
                onLoad={onMapLoad}
                onClick={() => setSelected(null)}
              >
                {/* PRO markers */}
                {sessions
                  .filter((s) => s.lat && s.lng)
                  .map((s) => (
                    <ProMarker
                      key={s.id}
                      session={s}
                      selected={s.id === selected}
                      elapsedLabel={elapsed(s.check_in_at)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(s.id === selected ? null : s.id);
                      }}
                    />
                  ))}

                {/* Info popup for selected PRO */}
                {selSession && selSession.lat && selSession.lng && (
                  <InfoWindow
                    position={{ lat: selSession.lat, lng: selSession.lng }}
                    onCloseClick={() => setSelected(null)}
                    options={{ pixelOffset: new window.google.maps.Size(0, -50) }}
                  >
                    <div style={{ fontFamily: "system-ui,sans-serif", width: 260 }}>
                      {/* Popup header */}
                      <div
                        style={{
                          background: "linear-gradient(135deg,#16A34A,#15803D)",
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {selSession.selfie_photo ? (
                          <img
                            src={selSession.selfie_photo}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              objectFit: "cover",
                              border: "2px solid rgba(255,255,255,0.4)",
                              flexShrink: 0,
                            }}
                            alt="selfie"
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: "rgba(255,255,255,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: 18,
                              flexShrink: 0,
                            }}
                          >
                            {(selSession.pro_username || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 14,
                              color: "#fff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {selSession.pro_username}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                            {selSession.centre}
                          </div>
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: 20,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {elapsed(selSession.check_in_at)}
                        </div>
                      </div>
                      {/* Popup body */}
                      <div style={{ padding: "12px 16px" }}>
                        <div
                          style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3 }}
                        >
                          {selSession.venue_name}
                        </div>
                        {selSession.district && (
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                            {selSession.district}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: C.faint }}>
                          Since{" "}
                          {new Date(selSession.check_in_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                          <span
                            style={{
                              background: "#EFF6FF",
                              color: C.info,
                              border: "1px solid #BFDBFE",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            GPS Verified
                          </span>
                          {selSession.selfie_photo && (
                            <span
                              style={{
                                background: "#F0FDF4",
                                color: C.success,
                                border: "1px solid #BBF7D0",
                                borderRadius: 20,
                                padding: "3px 10px",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              Selfie
                            </span>
                          )}
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${selSession.lat},${selSession.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 10,
                            color: C.info,
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <MapPin size={11} /> View in Google Maps
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div
                style={{
                  height: isMobile ? 340 : 520,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.muted,
                  fontSize: 13,
                }}
              >
                Loading map…
              </div>
            )}
          </div>

          {/* Side list */}
          <div
            style={{
              width: isMobile ? "100%" : 280,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              All Sessions ({sessions.length})
            </div>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelected(s.id === selected ? null : s.id)}
                style={{
                  background: C.card,
                  border: `1.5px solid ${s.id === selected ? C.success : C.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  cursor: "pointer",
                  transition: "border-color .15s",
                  boxShadow: s.id === selected ? "0 0 0 3px #16A34A18" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {s.selfie_photo ? (
                    <img
                      src={s.selfie_photo}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                      alt="selfie"
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${C.brand}12`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.brand,
                        fontWeight: 800,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {(s.pro_username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: C.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.pro_username}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.venue_name}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.success }}>
                      {elapsed(s.check_in_at)}
                    </div>
                    {!s.lat && (
                      <div style={{ fontSize: 9, color: C.faint, marginTop: 2 }}>No GPS</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── CARDS VIEW ── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(340px,1fr))",
            gap: 14,
          }}
        >
          {sessions.map((s) => (
            <div
              key={s.id}
              style={{
                background: C.card,
                border: `1.5px solid #16A34A25`,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(22,163,74,0.07)",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg,#16A34A,#15803D)",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#fff",
                      animation: "_lpulse 2s ease-in-out infinite",
                    }}
                  />
                  <span
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Live Visit
                  </span>
                </div>
                <span
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {elapsed(s.check_in_at)}
                </span>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", gap: 14 }}>
                {s.selfie_photo ? (
                  <img
                    src={s.selfie_photo}
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      objectFit: "cover",
                      border: "2px solid #16A34A30",
                      flexShrink: 0,
                    }}
                    alt="selfie"
                  />
                ) : (
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      background: `${C.brand}12`,
                      border: `1px solid ${C.brand}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.brand,
                      fontWeight: 800,
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {(s.pro_username || "?")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: C.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.venue_name}
                  </div>
                  {s.district && (
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.district}</div>
                  )}
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginTop: 6 }}>
                    {s.pro_username}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {s.centre} · Since{" "}
                    {new Date(s.check_in_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {s.lat && s.lng ? (
                  <a
                    href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#EFF6FF",
                      color: C.info,
                      border: "1px solid #BFDBFE",
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <MapPin size={11} /> GPS Verified · View Map
                  </a>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: C.bg,
                      color: C.muted,
                      border: `1px solid ${C.border}`,
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <MapPin size={11} /> No GPS
                  </span>
                )}
                {s.selfie_photo && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#F0FDF4",
                      color: C.success,
                      border: "1px solid #BBF7D0",
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <Camera size={11} /> Selfie Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
