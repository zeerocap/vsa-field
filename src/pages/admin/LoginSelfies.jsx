import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Spinner } from "../../components/ui.jsx";
import { getLoginSelfies } from "../../api/field.api.js";
import Icon from "../../components/Icons.jsx";

export default function AdminLoginSelfies() {
  const [selfies,   setSelfies]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [proFilter, setProFilter] = useState("");
  const [preview,   setPreview]   = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  function load() {
    setLoading(true);
    getLoginSelfies({
      ...(dateFrom  ? { dateFrom }  : {}),
      ...(dateTo    ? { dateTo }    : {}),
      ...(proFilter ? { proUsername: proFilter } : {}),
      limit: 200,
    })
      .then(r => setSelfies(r?.selfies || r || []))
      .catch(() => setSelfies([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Group by date
  const byDate = selfies.reduce((acc, s) => {
    const d = s.login_date || s.created_at?.slice(0, 10) || "Unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>Login Selfies</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Photos captured at PRO login — grouped by date.</div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={today}
          style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", color: C.text, background: "#fff", outline: "none" }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} max={today}
          style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", color: C.text, background: "#fff", outline: "none" }} />
        <input type="text" placeholder="Filter by PRO username…" value={proFilter} onChange={e => setProFilter(e.target.value)}
          style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", flex: 1, minWidth: 160, color: C.text, background: "#fff", outline: "none" }} />
        <button onClick={load}
          style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="refresh" size={13} color="#fff" /> Apply
        </button>
      </div>

      {loading && <Spinner />}

      {!loading && selfies.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
          <Icon name="user" size={32} color={C.border} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>No login selfies yet</div>
          <div style={{ fontSize: 13, color: C.muted }}>Selfies appear here when PROs log in.</div>
        </div>
      )}

      {!loading && dates.map(date => (
        <div key={date} style={{ marginBottom: 28 }}>
          {/* Date header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon name="calendar" size={14} color={C.brand} />
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              {(() => {
                try { return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
                catch { return date; }
              })()}
            </span>
            <span style={{ background: `${C.brand}12`, color: C.brand, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
              {byDate[date].length} login{byDate[date].length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {byDate[date].map(s => (
              <div key={s.id || s.session_id}
                onClick={() => setPreview(s)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                {/* Photo */}
                <div style={{ width: "100%", aspectRatio: "4/3", background: "#111", position: "relative", overflow: "hidden" }}>
                  {s.login_selfie ? (
                    <img src={s.login_selfie} alt="login selfie"
                      style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 12 }}>No photo</div>
                  )}
                  {/* Time badge */}
                  {(s.login_time || s.check_in_at) && (
                    <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 7px" }}>
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
                        {s.login_time || new Date(s.check_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "10px 10px 12px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.pro_username || "Unknown"}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.centre || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Full-screen preview */}
      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, overflow: "hidden", maxWidth: 400, width: "100%" }}>
            {/* Header */}
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{preview.pro_username || "Unknown"}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {preview.login_date || ""}
                  {preview.login_time ? ` · ${preview.login_time}` : ""}
                  {preview.centre ? ` · ${preview.centre}` : ""}
                </div>
              </div>
              <button onClick={() => setPreview(null)}
                style={{ background: C.bg, border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="x" size={14} color={C.muted} />
              </button>
            </div>
            {preview.login_selfie ? (
              <img src={preview.login_selfie} alt="login selfie"
                style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>No photo available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
