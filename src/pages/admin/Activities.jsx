import { useState, useMemo } from "react";
import { X, Filter, AlertTriangle } from "lucide-react";
import C from "../../constants/theme.js";
import { ACTIVITY_TYPES, Pill, displayName, fmtDate, typeLabel } from "./_shared.jsx";

export default function ActivitiesTab({
  activities,
  authUser,
  isMobile,
  onSelectActivity,
  loading,
}) {
  const [fPro, setFPro] = useState("");
  const [fType, setFType] = useState("");
  const [fCentre, setFCentre] = useState("");
  const [fDistrict, setFDistrict] = useState("");
  const [fVenue, setFVenue] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const proOptions = useMemo(
    () => [...new Set(activities.map((a) => a.pro_username))].sort(),
    [activities]
  );
  const centreOptions = useMemo(
    () => [...new Set(activities.map((a) => a.centre).filter(Boolean))].sort(),
    [activities]
  );
  const districtOptions = useMemo(
    () => [...new Set(activities.map((a) => a.district).filter(Boolean))].sort(),
    [activities]
  );

  const filtered = useMemo(
    () =>
      activities.filter((a) => {
        if (fPro && a.pro_username !== fPro) return false;
        if (fType && a.activity_type !== fType) return false;
        if (fCentre && a.centre !== fCentre) return false;
        if (fDistrict && a.district !== fDistrict) return false;
        if (fFrom && a.activity_date < fFrom) return false;
        if (fTo && a.activity_date > fTo) return false;
        if (fVenue && !(a.venue_name || "").toLowerCase().includes(fVenue.toLowerCase()))
          return false;
        return true;
      }),
    [activities, fPro, fType, fCentre, fDistrict, fVenue, fFrom, fTo]
  );

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
  const hasFilter = fPro || fType || fCentre || fDistrict || fVenue || fFrom || fTo;

  const clearAll = () => {
    setFPro("");
    setFType("");
    setFCentre("");
    setFDistrict("");
    setFVenue("");
    setFFrom("");
    setFTo("");
  };
  const advActive = !!(fPro || fType || fCentre || fDistrict || fFrom || fTo);

  return (
    <div>
      {/* ── Filter bar ── */}
      {isMobile ? (
        <div style={{ marginBottom: 14 }}>
          {/* Mobile: search + toggle row */}
          <div style={{ display: "flex", gap: 8, marginBottom: showFilters ? 8 : 0 }}>
            <input
              value={fVenue}
              onChange={(e) => setFVenue(e.target.value)}
              placeholder="Search venue…"
              style={{ ...ss, flex: 1, cursor: "text" }}
            />
            <button
              onClick={() => setShowFilters((s) => !s)}
              style={{
                ...ss,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                background: advActive ? `${C.brand}10` : C.card,
                borderColor: advActive ? C.brand : C.border,
                color: advActive ? C.brand : C.muted,
                fontWeight: advActive ? 700 : 500,
              }}
            >
              <Filter size={13} /> Filters{advActive ? " ●" : ""}
            </button>
            {hasFilter && (
              <button
                onClick={clearAll}
                style={{
                  ...ss,
                  cursor: "pointer",
                  color: C.danger,
                  borderColor: `${C.danger}30`,
                  background: `${C.danger}08`,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
          {/* Mobile: expanded filter panel */}
          {showFilters && (
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {authUser.role === "admin" && (
                <select
                  value={fCentre}
                  onChange={(e) => setFCentre(e.target.value)}
                  style={{ ...ss, width: "100%" }}
                >
                  <option value="">All Centres</option>
                  {centreOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={fPro}
                onChange={(e) => setFPro(e.target.value)}
                style={{ ...ss, width: "100%" }}
              >
                <option value="">All PROs</option>
                {proOptions.map((p) => (
                  <option key={p} value={p}>
                    {displayName(p)}
                  </option>
                ))}
              </select>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value)}
                style={{ ...ss, width: "100%" }}
              >
                <option value="">All Types</option>
                {(ACTIVITY_TYPES || []).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {districtOptions.length > 0 && (
                <select
                  value={fDistrict}
                  onChange={(e) => setFDistrict(e.target.value)}
                  style={{ ...ss, width: "100%" }}
                >
                  <option value="">All Districts</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
              </div>
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
            {filtered.length} records
          </div>
        </div>
      ) : (
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
          {authUser.role === "admin" && (
            <select value={fCentre} onChange={(e) => setFCentre(e.target.value)} style={ss}>
              <option value="">All Centres</option>
              {centreOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <select value={fPro} onChange={(e) => setFPro(e.target.value)} style={ss}>
            <option value="">All PROs</option>
            {proOptions.map((p) => (
              <option key={p} value={p}>
                {displayName(p)}
              </option>
            ))}
          </select>
          <input
            value={fVenue}
            onChange={(e) => setFVenue(e.target.value)}
            placeholder="Search venue…"
            style={{ ...ss, cursor: "text", minWidth: 140 }}
          />
          <select value={fType} onChange={(e) => setFType(e.target.value)} style={ss}>
            <option value="">All Types</option>
            {(ACTIVITY_TYPES || []).map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {districtOptions.length > 0 && (
            <select value={fDistrict} onChange={(e) => setFDistrict(e.target.value)} style={ss}>
              <option value="">All Districts</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={fFrom}
            onChange={(e) => setFFrom(e.target.value)}
            style={{ ...ss, cursor: "text" }}
            title="From date"
          />
          <input
            type="date"
            value={fTo}
            onChange={(e) => setFTo(e.target.value)}
            style={{ ...ss, cursor: "text" }}
            title="To date"
          />
          {hasFilter && (
            <button
              onClick={clearAll}
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
            {filtered.length} records
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 14 }}>
          Loading activities…
        </div>
      ) : (
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          {isMobile ? (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 13 }}>
                  No activities match filters
                </div>
              )}
              {filtered.map((a) => (
                <div
                  key={a.id}
                  onClick={() => onSelectActivity(a)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    cursor: "pointer",
                    transition: "box-shadow .12s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                        {a.venue_name || "Unknown Venue"}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {fmtDate(a.activity_date)} · {displayName(a.pro_username)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.brand }}>
                        {a.leads_captured || 0}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>leads</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Pill label={typeLabel(a.activity_type)} color={C.purple} />
                    {a.centre && <Pill label={a.centre} color={C.info} />}
                    {a.is_late_entry && <Pill label="Late Entry" color={C.warning} />}
                  </div>
                  {(a.notes || a.description) && (
                    <div
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        marginTop: 7,
                        paddingTop: 7,
                        borderTop: `1px solid ${C.border}`,
                        lineHeight: 1.5,
                      }}
                    >
                      {(a.notes || a.description).slice(0, 100)}
                      {(a.notes || a.description).length > 100 ? "…" : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {["Date", "PRO", "Centre", "Venue", "Type", "Leads", "Notes", ""].map((h) => (
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
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}
                      >
                        No activities match filters
                      </td>
                    </tr>
                  )}
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => onSelectActivity(a)}
                      style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF8FB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 12,
                          color: C.muted,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtDate(a.activity_date)}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {displayName(a.pro_username)}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <Pill label={a.centre || "—"} color={C.info} />
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 12,
                          color: C.text,
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={a.venue_name}
                      >
                        {a.venue_name || "—"}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <Pill label={typeLabel(a.activity_type)} color={C.purple} />
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: (a.leads_captured || 0) > 0 ? C.brand : C.muted,
                          }}
                        >
                          {a.leads_captured || 0}
                        </span>
                        {a.is_late_entry && (
                          <AlertTriangle
                            size={11}
                            color={C.warning}
                            style={{ marginLeft: 5 }}
                            title="Late entry"
                          />
                        )}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 11,
                          color: C.muted,
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={a.notes || a.description}
                      >
                        {a.notes || a.description || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 11,
                          color: C.brand,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        View
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
