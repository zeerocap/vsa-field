import { useState, useEffect, useMemo } from "react";
import { X, Filter, Phone, User } from "lucide-react";
import C from "../../constants/theme.js";
import { Pill, STATUS_COLOR, displayName, getFieldLeadsApi } from "./_shared.jsx";

export default function FieldLeadsTab({ authUser, isMobile }) {
  const [fieldLeads, setFieldLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lSearch, setLSearch] = useState("");
  const [lStatus, setLStatus] = useState("");
  const [lPro, setLPro] = useState("");
  const [lCentre, setLCentre] = useState("");

  useEffect(() => {
    setLoading(true);
    getFieldLeadsApi(authUser.token, { limit: 500 })
      .then((r) => {
        if (r.ok) setFieldLeads(r.leads || []);
      })
      .finally(() => setLoading(false));
  }, [authUser.token]);

  const proOptions = useMemo(
    () => [...new Set(fieldLeads.map((l) => l.pro_username).filter(Boolean))].sort(),
    [fieldLeads]
  );
  const centreOptions = useMemo(
    () => [...new Set(fieldLeads.map((l) => l.centre).filter(Boolean))].sort(),
    [fieldLeads]
  );

  const filtered = useMemo(
    () =>
      fieldLeads.filter((l) => {
        const name = l.full_name || l.name || "";
        const phone = l.phone_number || l.phone || "";
        if (lSearch && !`${name} ${phone}`.toLowerCase().includes(lSearch.toLowerCase()))
          return false;
        if (lStatus && l.crm_status !== lStatus) return false;
        if (lPro && l.pro_username !== lPro) return false;
        if (lCentre && l.centre !== lCentre) return false;
        return true;
      }),
    [fieldLeads, lSearch, lStatus, lPro, lCentre]
  );

  const statusCounts = useMemo(() => {
    const m = {};
    fieldLeads.forEach((l) => {
      const s = l.crm_status || "New";
      m[s] = (m[s] || 0) + 1;
    });
    return m;
  }, [fieldLeads]);

  // Conversion funnel
  const total = fieldLeads.length;
  const contacted = fieldLeads.filter((l) => l.crm_status && l.crm_status !== "New").length;
  const interested = fieldLeads.filter((l) =>
    ["Interested", "Converted", "Enrolled", "Visited Center", "Callback Requested"].includes(
      l.crm_status
    )
  ).length;
  const converted = fieldLeads.filter((l) =>
    ["Converted", "Enrolled"].includes(l.crm_status)
  ).length;

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
      {/* Conversion funnel (desktop only) */}
      {!isMobile && total > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            { label: "Total Leads", value: total, color: C.info, pct: 100 },
            {
              label: "Contacted",
              value: contacted,
              color: C.purple,
              pct: Math.round((contacted / total) * 100),
            },
            {
              label: "Interested",
              value: interested,
              color: C.brand,
              pct: Math.round((interested / total) * 100),
            },
            {
              label: "Converted",
              value: converted,
              color: C.success,
              pct: Math.round((converted / total) * 100),
            },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                background: C.card,
                borderRadius: 12,
                padding: "14px 16px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                  marginBottom: 4,
                }}
              >
                {f.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: f.color, lineHeight: 1 }}>
                {f.value}
              </div>
              <div style={{ marginTop: 8, height: 3, background: C.border, borderRadius: 3 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${f.pct}%`,
                    background: f.color,
                    borderRadius: 3,
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: f.color, fontWeight: 600, marginTop: 4 }}>
                {f.pct}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {Object.entries(statusCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([s, n]) => {
            const col = STATUS_COLOR[s] || C.muted;
            const active = lStatus === s;
            return (
              <button
                key={s}
                onClick={() => setLStatus(active ? "" : s)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: `1px solid ${active ? col + "55" : C.border}`,
                  background: active ? `${col}14` : "transparent",
                  color: active ? col : C.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all .12s",
                }}
              >
                {s} <strong>{n}</strong>
              </button>
            );
          })}
        {lStatus && (
          <button
            onClick={() => setLStatus("")}
            style={{
              padding: "5px 10px",
              borderRadius: 20,
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
            <X size={10} /> Clear
          </button>
        )}
      </div>

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
        <input
          value={lSearch}
          onChange={(e) => setLSearch(e.target.value)}
          placeholder="Search name or phone…"
          style={{ ...ss, cursor: "text", minWidth: 160 }}
        />
        {authUser.role === "admin" && (
          <select value={lCentre} onChange={(e) => setLCentre(e.target.value)} style={ss}>
            <option value="">All Centres</option>
            {centreOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <select value={lPro} onChange={(e) => setLPro(e.target.value)} style={ss}>
          <option value="">All PROs</option>
          {proOptions.map((p) => (
            <option key={p} value={p}>
              {displayName(p)}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>
          {filtered.length} leads
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 14 }}>
          Loading field leads…
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
          {fieldLeads.length === 0
            ? "No field leads yet — they appear here when PROs capture leads during field visits."
            : "No leads match the current filters"}
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((l, i) => {
            const sc = STATUS_COLOR[l.crm_status] || C.muted;
            const name = l.full_name || l.name || "Unknown";
            const ph = l.phone_number || l.phone || "";
            return (
              <div
                key={l.id || i}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{name}</div>
                    {ph && <div style={{ fontSize: 12, color: C.info }}>{ph}</div>}
                  </div>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: `${sc}15`,
                      color: sc,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.crm_status || "New"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(l.course_interested || l.course_interest) && (
                    <Pill label={l.course_interested || l.course_interest} color={C.purple} />
                  )}
                  {l.centre && <Pill label={l.centre} color={C.info} />}
                  <span style={{ fontSize: 11, color: C.muted }}>
                    by {displayName(l.pro_username)}
                  </span>
                </div>
                {l.crm_counselor && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <User size={11} /> {l.crm_counselor}
                  </div>
                )}
              </div>
            );
          })}
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {[
                  "Name",
                  "Phone",
                  "Course",
                  "PRO",
                  "Centre",
                  "CRM Status",
                  "Counselor",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.muted,
                      letterSpacing: 0.4,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const sc = STATUS_COLOR[l.crm_status] || C.muted;
                const name = l.full_name || l.name || "—";
                const ph = l.phone_number || l.phone || "";
                return (
                  <tr
                    key={l.id || i}
                    style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13, color: C.text }}
                    >
                      {name}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12 }}>
                      {ph ? (
                        <a href={`tel:${ph}`} style={{ color: C.info, textDecoration: "none" }}>
                          {ph}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {l.course_interested || l.course_interest ? (
                        <Pill label={l.course_interested || l.course_interest} color={C.purple} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: C.text }}>
                      {displayName(l.pro_username)}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {l.centre ? <Pill label={l.centre} color={C.info} /> : "—"}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: `${sc}15`,
                          color: sc,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {l.crm_status || "New"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: C.muted }}>
                      {l.crm_counselor || "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontSize: 11,
                        color: C.faint,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.created_at
                        ? new Date(l.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// ─── Targets Tab ─────────────────────────────────────────────────────────────
