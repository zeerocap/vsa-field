import { useState, useEffect, useMemo } from "react";
import {
  X,
  MapPin,
  Filter,
  Phone,
  Check,
  Building2,
  GraduationCap,
  BookOpen,
  Store,
  Pin,
} from "lucide-react";
import C from "../../constants/theme.js";
import { KERALA_DISTRICTS, Pill, getFieldVenuesApi } from "./_shared.jsx";
import PinLocationModal from "./PinLocationModal.jsx";

export default function VenuesTab({ authUser, isMobile }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vSearch, setVSearch] = useState("");
  const [vDistrict, setVDistrict] = useState("");
  const [vType, setVType] = useState("");
  const [pinVenue, setPinVenue] = useState(null); // venue being pinned

  useEffect(() => {
    setLoading(true);
    getFieldVenuesApi(authUser.token, { limit: 500 })
      .then((r) => {
        if (r.ok) setVenues(r.venues || []);
      })
      .finally(() => setLoading(false));
  }, [authUser.token]);

  const typeOptions = useMemo(
    () => [...new Set(venues.map((v) => v.venue_type).filter(Boolean))].sort(),
    [venues]
  );

  const filtered = useMemo(
    () =>
      venues.filter((v) => {
        if (vSearch && !v.name?.toLowerCase().includes(vSearch.toLowerCase())) return false;
        if (vDistrict && v.district !== vDistrict) return false;
        if (vType && v.venue_type !== vType) return false;
        return true;
      }),
    [venues, vSearch, vDistrict, vType]
  );

  const RELN_COLOR = { active: C.success, new: C.info, inactive: C.muted };
  const VenueTypeIcon = ({ type, size = 18 }) => {
    if (!type) return <Building2 size={size} color={C.muted} />;
    const l = type.toLowerCase();
    if (l.includes("school") || l.includes("college"))
      return <GraduationCap size={size} color={C.brand} />;
    if (l.includes("coaching") || l.includes("institute"))
      return <BookOpen size={size} color={C.brand} />;
    if (l.includes("mall") || l.includes("store") || l.includes("event"))
      return <Store size={size} color={C.brand} />;
    return <Building2 size={size} color={C.muted} />;
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
        <input
          value={vSearch}
          onChange={(e) => setVSearch(e.target.value)}
          placeholder="Search venues…"
          style={{ ...ss, cursor: "text", minWidth: 160 }}
        />
        <select value={vDistrict} onChange={(e) => setVDistrict(e.target.value)} style={ss}>
          <option value="">All Districts</option>
          {(KERALA_DISTRICTS || []).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={vType} onChange={(e) => setVType(e.target.value)} style={ss}>
          <option value="">All Types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {(vSearch || vDistrict || vType) && (
          <button
            onClick={() => {
              setVSearch("");
              setVDistrict("");
              setVType("");
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
          {filtered.length} venues
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 14 }}>
          Loading venues…
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
          No venues found
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))",
            gap: 12,
          }}
        >
          {filtered.map((v) => {
            const relnColor = RELN_COLOR[v.relationship_status] || C.muted;
            return (
              <div
                key={v.id}
                style={{
                  background: C.card,
                  borderRadius: 12,
                  padding: "14px 16px",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,.04)",
                  transition: "box-shadow .15s, transform .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.04)";
                  e.currentTarget.style.transform = "none";
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
                      {v.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        marginTop: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MapPin size={10} color={C.muted} />
                      {[v.place, v.district, v.centre].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div style={{ marginLeft: 8, flexShrink: 0 }}>
                    <VenueTypeIcon type={v.venue_type} size={20} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <Pill
                    label={v.venue_type || "venue"}
                    color={v.venue_type === "mall" ? C.purple : C.success}
                  />
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: `${relnColor}10`,
                      color: relnColor,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: relnColor,
                        display: "inline-block",
                      }}
                    />
                    {v.relationship_status || "new"}
                  </span>
                </div>

                {(v.contact_name || v.contact_phone) && (
                  <div
                    style={{
                      fontSize: 11,
                      marginBottom: 10,
                      paddingBottom: 10,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {v.contact_name && (
                      <span style={{ fontWeight: 600, color: C.text }}>
                        {v.contact_name}
                        {v.contact_position && (
                          <span style={{ color: C.muted, fontWeight: 400 }}>
                            {" "}
                            · {v.contact_position}
                          </span>
                        )}
                      </span>
                    )}
                    {v.contact_phone && (
                      <a
                        href={`tel:${v.contact_phone}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: C.info,
                          textDecoration: "none",
                          marginTop: 3,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={10} />
                        {v.contact_phone}
                      </a>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 17, fontWeight: 800, color: C.brand }}>
                      {v.total_visits || 0}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>visits</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 17, fontWeight: 800, color: C.info }}>
                      {v.total_leads || 0}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>leads</span>
                  </div>
                  {(v.total_visits || 0) > 0 && (
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.success }}>
                        {((v.total_leads || 0) / v.total_visits).toFixed(1)}
                      </span>
                      <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>avg</span>
                    </div>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 10, color: C.faint }}>
                    by {v.created_by || "—"}
                  </span>
                </div>

                {/* Pin location row */}
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {v.geo_confirmed ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        color: C.success,
                        fontWeight: 600,
                      }}
                    >
                      <Check size={11} color={C.success} strokeWidth={3} />
                      Location pinned · {v.geo_radius || 300}m radius
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: C.muted }}>No location pinned</div>
                  )}
                  <button
                    onClick={() => setPinVenue(v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px",
                      borderRadius: 8,
                      border: `1px solid ${v.geo_confirmed ? C.brand + "40" : C.border}`,
                      background: v.geo_confirmed ? `${C.brand}08` : C.bg,
                      color: v.geo_confirmed ? C.brand : C.muted,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Pin size={11} />
                    {v.geo_confirmed ? "Re-pin" : "Pin Location"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pinVenue && (
        <PinLocationModal
          authUser={authUser}
          venue={pinVenue}
          onClose={() => setPinVenue(null)}
          onPinned={(updated) => {
            setVenues((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));
            setPinVenue(null);
          }}
        />
      )}
    </div>
  );
}
