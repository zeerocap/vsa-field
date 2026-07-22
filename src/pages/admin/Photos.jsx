import { useState, useEffect, useCallback } from "react";
import { X, Camera } from "lucide-react";
import C from "../../constants/theme.js";
import { getFieldPhotosApi } from "./_shared.jsx";

export default function PhotosTab({ authUser, proMap, isMobile }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // signed URL
  const [filterPro, setFilterPro] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getFieldPhotosApi(authUser.token, {
      limit: 60,
      ...(filterPro ? { proUsername: filterPro } : {}),
      ...(filterFrom ? { dateFrom: filterFrom } : {}),
      ...(filterTo ? { dateTo: filterTo } : {}),
    }).then((r) => {
      if (r.ok) setPhotos(r.photos || []);
      setLoading(false);
    });
  }, [authUser.token, filterPro, filterFrom, filterTo]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <select
          value={filterPro}
          onChange={(e) => setFilterPro(e.target.value)}
          style={{
            padding: "9px 12px",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "inherit",
            background: "#fff",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <option value="">All PROs</option>
          {proMap.map((p) => (
            <option key={p.username} value={p.username}>
              {p.username}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            style={{
              flex: 1,
              padding: "9px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            style={{
              flex: 1,
              padding: "9px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
        </div>
        {(filterPro || filterFrom || filterTo) && (
          <button
            onClick={() => {
              setFilterPro("");
              setFilterFrom("");
              setFilterTo("");
            }}
            style={{
              padding: "9px 12px",
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              width: isMobile ? "100%" : "auto",
              justifyContent: "center",
            }}
          >
            <X size={11} /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Loading photos…</div>
      ) : photos.length === 0 ? (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <Camera size={36} color={C.muted} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>
            No photos found
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            PROs can attach photos when logging field activities.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(200px,1fr))",
            gap: 10,
          }}
        >
          {photos.map((p) => (
            <div
              key={p.id}
              onClick={() => setLightbox(p.signedUrl)}
              style={{
                borderRadius: 10,
                overflow: "hidden",
                border: `1px solid ${C.border}`,
                cursor: "pointer",
                background: C.card,
                position: "relative",
              }}
            >
              {p.signedUrl ? (
                <img
                  src={p.signedUrl}
                  alt={p.caption || "field photo"}
                  style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    height: 160,
                    background: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Camera size={24} color={C.muted} />
                </div>
              )}
              <div style={{ padding: "8px 10px" }}>
                {p.caption && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    {p.caption}
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.muted }}>
                  {p.field_activities?.pro_username || "—"} ·{" "}
                  {p.field_activities?.venue_name || "—"}
                </div>
                <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>
                  {p.field_activities?.activity_date
                    ? new Date(p.field_activities.activity_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 9500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <img
            src={lightbox}
            alt="Field photo"
            style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 10, objectFit: "contain" }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
