import { useState, useEffect, useMemo } from "react";
import { X, Clock, Filter, Camera, ShieldCheck, ShieldAlert } from "lucide-react";
import C from "../../constants/theme.js";
import { displayName, getFieldSessionsApi } from "./_shared.jsx";

export default function SessionsTab({ authUser, isMobile }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fPro, setFPro] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fFlag, setFFlag] = useState(""); // "fake_gps" | "short" | "auto" | "late"

  useEffect(() => {
    setLoading(true);
    getFieldSessionsApi(authUser.token, {
      limit: 300,
      ...(fFrom ? { dateFrom: fFrom } : {}),
      ...(fTo ? { dateTo: fTo } : {}),
    })
      .then((r) => {
        if (r.ok) setSessions(r.sessions || []);
      })
      .finally(() => setLoading(false));
  }, [authUser.token, fFrom, fTo]);

  const proOptions = useMemo(
    () => [...new Set(sessions.map((s) => s.pro_username))].sort(),
    [sessions]
  );

  const filtered = useMemo(
    () =>
      sessions.filter((s) => {
        if (fPro && s.pro_username !== fPro) return false;
        if (fFlag === "fake_gps" && !s.flagged_fake_gps) return false;
        if (fFlag === "short" && !s.flagged_short_visit) return false;
        if (fFlag === "auto" && !s.is_auto_checkout) return false;
        if (fFlag === "low" && (s.trust_score == null || s.trust_score > 2)) return false;
        return true;
      }),
    [sessions, fPro, fFlag]
  );

  const TrustBadge = ({ score }) => {
    if (score == null) return <span style={{ fontSize: 11, color: C.muted }}>—</span>;
    const color = score >= 4 ? C.success : score >= 3 ? C.warning : C.danger;
    const bg = score >= 4 ? `${C.success}12` : score >= 3 ? `${C.warning}12` : "#FEF2F2";
    const Icon = score >= 4 ? ShieldCheck : ShieldAlert;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 20,
          background: bg,
          color,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <Icon size={10} strokeWidth={2.5} />
        {score}/5
      </span>
    );
  };

  const elapsed = (inAt, outAt) => {
    const m = Math.round((new Date(outAt) - new Date(inAt)) / 60000);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const ss = {
    padding: "7px 10px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 12,
    color: C.text,
    background: C.card,
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
          padding: "11px 14px",
          background: C.card,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          alignItems: "center",
        }}
      >
        <Filter size={14} color={C.muted} />
        <select value={fPro} onChange={(e) => setFPro(e.target.value)} style={ss}>
          <option value="">All PROs</option>
          {proOptions.map((p) => (
            <option key={p} value={p}>
              {displayName(p)}
            </option>
          ))}
        </select>
        <select value={fFlag} onChange={(e) => setFFlag(e.target.value)} style={ss}>
          <option value="">All sessions</option>
          <option value="fake_gps">Fake GPS flagged</option>
          <option value="short">Short visit (&lt;20 min)</option>
          <option value="auto">Auto-checkout</option>
          <option value="low">Low trust (0–2)</option>
        </select>
        <input
          type="date"
          value={fFrom}
          onChange={(e) => setFFrom(e.target.value)}
          style={{ ...ss, cursor: "text" }}
          title="From"
        />
        <input
          type="date"
          value={fTo}
          onChange={(e) => setFTo(e.target.value)}
          style={{ ...ss, cursor: "text" }}
          title="To"
        />
        {(fPro || fFlag || fFrom || fTo) && (
          <button
            onClick={() => {
              setFPro("");
              setFFlag("");
              setFFrom("");
              setFTo("");
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <X size={11} /> Clear
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>
          {filtered.length} sessions
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 14 }}>
          Loading sessions…
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: C.muted,
            fontSize: 13,
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          No sessions found
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((s) => (
            <div
              key={s.id}
              style={{
                background: C.card,
                border: `1px solid ${s.flagged_fake_gps || (s.trust_score != null && s.trust_score <= 2) ? `${C.danger}40` : C.border}`,
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{s.venue_name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {displayName(s.pro_username)} · {s.district}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                    {new Date(s.check_in_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {elapsed(s.check_in_at, s.check_out_at)}
                  </div>
                </div>
                <TrustBadge score={s.trust_score} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {s.flagged_fake_gps && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: "#FEF2F2",
                      color: C.danger,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <ShieldAlert size={9} />
                    Fake GPS
                  </span>
                )}
                {s.flagged_short_visit && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: `${C.warning}15`,
                      color: C.warning,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Clock size={9} />
                    Short visit
                  </span>
                )}
                {s.is_auto_checkout && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: `${C.info}12`,
                      color: C.info,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <LogOut size={9} />
                    Auto-closed
                  </span>
                )}
                {s.selfie_photo && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: `${C.success}12`,
                      color: C.success,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Camera size={9} />
                    Selfie
                  </span>
                )}
                {s.distance_from_venue != null && (
                  <span style={{ fontSize: 10, color: C.muted, padding: "2px 7px" }}>
                    {Math.round(s.distance_from_venue)}m from venue
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Date", "PRO", "Venue", "Duration", "Trust", "Flags", "Distance", "Selfie"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "9px 14px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.muted,
                          letterSpacing: 0.4,
                          borderBottom: `1px solid ${C.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const suspicious =
                    s.flagged_fake_gps || (s.trust_score != null && s.trust_score <= 2);
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: suspicious ? "#FFF8F8" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 12,
                          color: C.muted,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(s.check_in_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {displayName(s.pro_username)}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 12,
                          color: C.text,
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={s.venue_name}
                      >
                        {s.venue_name}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 12,
                          color: C.muted,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.duration_mins != null
                          ? s.duration_mins < 60
                            ? `${s.duration_mins}m`
                            : `${Math.floor(s.duration_mins / 60)}h ${s.duration_mins % 60}m`
                          : "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <TrustBadge score={s.trust_score} />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {s.flagged_fake_gps && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 20,
                                background: "#FEF2F2",
                                color: C.danger,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <ShieldAlert size={9} />
                              Fake GPS
                            </span>
                          )}
                          {s.flagged_short_visit && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 20,
                                background: `${C.warning}15`,
                                color: C.warning,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Clock size={9} />
                              Short
                            </span>
                          )}
                          {s.is_auto_checkout && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 20,
                                background: `${C.info}12`,
                                color: C.info,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <LogOut size={9} />
                              Auto
                            </span>
                          )}
                          {!s.flagged_fake_gps && !s.flagged_short_visit && !s.is_auto_checkout && (
                            <span style={{ fontSize: 10, color: C.muted }}>—</span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 11,
                          color:
                            s.distance_from_venue != null
                              ? s.distance_from_venue <= 300
                                ? C.success
                                : C.warning
                              : C.muted,
                        }}
                      >
                        {s.distance_from_venue != null
                          ? `${Math.round(s.distance_from_venue)}m`
                          : "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {s.selfie_photo ? (
                          <img
                            src={s.selfie_photo}
                            alt="selfie"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              objectFit: "cover",
                              border: `1px solid ${C.border}`,
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: C.muted }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN SELFIES TAB — audit who actually logged in each day ────────────────
