import { useState, useEffect, useCallback } from "react";
import { X, Calendar, Filter, User, RefreshCw } from "lucide-react";
import C from "../../constants/theme.js";
import { displayName, getLoginSelfiesApi } from "./_shared.jsx";

export default function LoginSelfiesTab({ authUser, isMobile }) {
  const [selfies, setSelfies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [proFilter, setProFilter] = useState("");
  const [preview, setPreview] = useState(null); // full-screen selfie preview
  const [error, setError] = useState("");

  // useCallback + [load] so the filters actually re-query. Previously load() closed
  // over dateFrom/dateTo/proFilter while the effect ran once with [], so changing a
  // filter did nothing until an unrelated reload happened to fire.
  const load = useCallback(() => {
    setLoading(true);
    getLoginSelfiesApi(authUser.token, {
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(proFilter ? { proUsername: proFilter } : {}),
      limit: 200,
    })
      .then((r) => {
        if (r.ok) setSelfies(r.selfies || []);
        else setError(r.error || "Could not load login selfies");
      })
      .finally(() => setLoading(false));
  }, [authUser.token, dateFrom, dateTo, proFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);

  // Group by date for cleaner view
  const byDate = selfies.reduce((acc, s) => {
    const d = s.login_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "7px 10px",
            fontSize: 13,
            fontFamily: "inherit",
            color: C.text,
            background: "#fff",
          }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          max={today}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "7px 10px",
            fontSize: 13,
            fontFamily: "inherit",
            color: C.text,
            background: "#fff",
          }}
        />
        <input
          type="text"
          placeholder="Filter by PRO username..."
          value={proFilter}
          onChange={(e) => setProFilter(e.target.value)}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "7px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            flex: 1,
            minWidth: 160,
            color: C.text,
            background: "#fff",
          }}
        />
        <button
          onClick={load}
          style={{
            background: C.brand,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={13} /> Apply
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 13 }}>
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              border: "2px solid #E5E7EB",
              borderTopColor: C.brand,
              borderRadius: "50%",
              animation: "_spin 0.7s linear infinite",
            }}
          />
          <div style={{ marginTop: 10 }}>Loading login selfies...</div>
        </div>
      )}

      {!loading && selfies.length === 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "48px 24px",
            textAlign: "center",
            color: C.muted,
            fontSize: 13,
          }}
        >
          <User size={32} color={C.border} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>
            No login selfies yet
          </div>
          <div>Selfies will appear here when PROs log in.</div>
        </div>
      )}

      {!loading &&
        dates.map((date) => (
          <div key={date} style={{ marginBottom: 28 }}>
            {/* Date header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Calendar size={14} color={C.brand} />
              <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span
                style={{
                  background: `${C.brand}12`,
                  color: C.brand,
                  borderRadius: 20,
                  padding: "2px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {byDate[date].length} login{byDate[date].length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Grid of selfie cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2,1fr)"
                  : "repeat(auto-fill,minmax(160px,1fr))",
                gap: 12,
              }}
            >
              {byDate[date].map((s) => (
                <div
                  key={s.id}
                  onClick={() => setPreview(s)}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "box-shadow .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  {/* Selfie thumbnail */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      overflow: "hidden",
                      background: "#111",
                      position: "relative",
                    }}
                  >
                    <img
                      src={s.login_selfie}
                      alt="login selfie"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scaleX(-1)",
                        display: "block",
                      }}
                    />
                    {/* Time badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        background: "rgba(0,0,0,0.62)",
                        borderRadius: 6,
                        padding: "2px 7px",
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
                        {s.login_time || "--:--"}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: "10px 10px 12px" }}>
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
                      {displayName(s.pro_username)}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {s.centre || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Full-screen preview modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 18,
              overflow: "hidden",
              maxWidth: 400,
              width: "100%",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
                  {displayName(preview.pro_username)}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {new Date(preview.login_date + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {preview.login_time ? ` · ${preview.login_time}` : ""}
                  {preview.centre ? ` · ${preview.centre}` : ""}
                </div>
              </div>
              <button
                onClick={() => setPreview(null)}
                style={{
                  background: C.bg,
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={14} color={C.muted} />
              </button>
            </div>
            {/* Full selfie */}
            <img
              src={preview.login_selfie}
              alt="login selfie"
              style={{ width: "100%", display: "block", transform: "scaleX(-1)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FaceIdTab — manage face credentials for all PRO field staff ─────────────
