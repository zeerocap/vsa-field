// ─────────────────────────────────────────────────────────────────────────────
// Shared admin building blocks — constants, pure formatters, and the small
// presentational components reused across the admin section pages. Extracted
// from the old AdminPage monolith so each section can live in its own file.
// Depends only on the theme; never imports a section (no circular deps).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import C from "../../constants/theme.js";
import { call } from "../../utils/api.js";

// ── API adapters — call() handles the token internally. The `_t` arg is a
// legacy token param the callers still pass; it is ignored. ───────────────────
const _fa = (action) => async (_t, params) => call(action, params || {});
export const getFieldActivitiesApi = _fa("getFieldActivities");
export const getFieldVenuesApi = _fa("getFieldVenues");
export const addFieldVenueApi = _fa("addFieldVenue");
export const getFieldLeadsApi = _fa("getFieldLeads");
export const getFieldTargetsApi = _fa("getFieldTargets");
export const setFieldTargetApi = _fa("setFieldTarget");
export const getLiveSessionsApi = async () => call("getLiveSessions");
export const getTerritoriesApi = async () => call("getTerritories");
export const setTerritoryApi = _fa("setTerritory");
export const getFieldPhotosApi = _fa("getFieldPhotos");
export const setVenueLocationApi = _fa("setVenueLocation");
export const getFieldSessionsApi = _fa("getFieldSessions");
export const getLoginSelfiesApi = _fa("getLoginSelfies");
export const getProTrailApi = _fa("getProTrail");
export const getTrailSummaryApi = _fa("getTrailSummary");
export const fetchUsersApi = async () => call("getUsers");
export const revokeFaceApi = _fa("revokeFace");
export const enrollFaceApi = _fa("enrollFace");

// ── Constants ────────────────────────────────────────────────────────────────
export const ACTIVITY_TYPES = [
  { value: "school_visit", label: "School Visit" },
  { value: "mall_activation", label: "Mall Activation" },
  { value: "event", label: "Event" },
  { value: "door_to_door", label: "Door to Door" },
  { value: "other", label: "Other" },
];

// Status colours for field leads (matches CRM)
export const STATUS_COLOR = {
  New: C.info,
  Contacted: "#0284C7",
  Interested: C.brand,
  Converted: C.success,
  Enrolled: C.success,
  "Not Interested": C.muted,
  "Called — No Answer": C.muted,
  "Callback Requested": C.purple,
  "Visited Center": C.warning,
  Dead: C.faint,
  "Invalid Number": C.faint,
};

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
];

// Google Maps JS API key — read from the environment where the map panes load it.
export const GMAP_KEY = import.meta.env.VITE_GMAP_KEY || "";

// Shared Google Maps option presets (POI/transit labels off, no map-type switch).
export const GMAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  mapTypeControl: false,
  clickableIcons: false,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};
// Trail viewer uses the same preset.
export const TRAIL_MAP_OPTS = GMAP_OPTIONS;

// District centroids for the admin heatmap.
export const KERALA_DISTRICT_CENTERS = {
  Kasaragod: { lat: 12.499, lng: 74.987 },
  Kannur: { lat: 11.874, lng: 75.37 },
  Wayanad: { lat: 11.685, lng: 76.132 },
  Kozhikode: { lat: 11.259, lng: 75.78 },
  Malappuram: { lat: 11.051, lng: 76.071 },
  Palakkad: { lat: 10.787, lng: 76.655 },
  Thrissur: { lat: 10.528, lng: 76.214 },
  Ernakulam: { lat: 10.016, lng: 76.342 },
  Idukki: { lat: 9.919, lng: 77.103 },
  Alappuzha: { lat: 9.498, lng: 76.339 },
  Kottayam: { lat: 9.592, lng: 76.522 },
  Pathanamthitta: { lat: 9.265, lng: 76.787 },
  Kollam: { lat: 8.893, lng: 76.614 },
  Thiruvananthapuram: { lat: 8.524, lng: 76.937 },
};

// ── Pure formatters ──────────────────────────────────────────────────────────
// Reverse-geocode a stop via OpenStreetMap Nominatim (free, no key). Returns the
// two most-local name parts, or the raw lat/lng on failure.
export async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=17`,
      { headers: { "Accept-Language": "en" } }
    );
    const d = await r.json();
    if (d?.display_name) {
      const parts = d.display_name.split(",").map((s) => s.trim());
      return parts.slice(0, 2).join(", ");
    }
  } catch {
    /* silent */
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

export const daysSince = (d) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d + "T00:00:00")) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
};

export const typeLabel = (v) =>
  ACTIVITY_TYPES?.find((t) => t.value === v)?.label || (v ? v.replace(/_/g, " ") : "—");

export const displayName = (u) => {
  if (!u) return "—";
  const n = u.replace(/\.pro$/i, "");
  return n.charAt(0).toUpperCase() + n.slice(1);
};

export function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtDuration(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60),
    m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Presentational micro-components ──────────────────────────────────────────
export const Pill = ({ label, color = C.brand }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 9px",
      borderRadius: 20,
      background: `${color}15`,
      color,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      lineHeight: "18px",
    }}
  >
    {label}
  </span>
);

// KPI card — matches the CRM KPICard exactly (radius 10, compact 14x12 padding,
// 10px top-left label, 22px top-right icon chip, 28/700 value, hover state) so
// Field's stat cards read identically to the parent CRM app.
export function KPICard({ icon: Icon, label, value, color = C.brand, sub, isMobile }) {
  const [hov, setHov] = useState(false);
  const displayVal = typeof value === "number" ? value.toLocaleString("en-IN") : value;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#FAFAFA" : C.card,
        borderRadius: 10,
        padding: isMobile ? "10px 12px" : "14px 12px",
        border: `1px solid ${hov ? "#D8D8D8" : C.border}`,
        transition: "all .15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: isMobile ? 6 : 7,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.01em" }}>
          {label}
        </div>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: `${color}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon && <Icon size={11} color={color} />}
        </div>
      </div>
      <div
        style={{
          fontSize: isMobile ? 20 : 28,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          marginBottom: sub ? (isMobile ? 3 : 4) : 0,
        }}
      >
        {displayVal}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.faint }}>{sub}</div>}
    </div>
  );
}

export const SectionCard = ({ title, icon: Icon, right, children }) => (
  <div
    style={{
      background: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,.05)",
      marginBottom: 14,
    }}
  >
    <div
      style={{
        padding: "13px 20px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && <Icon size={15} color={C.muted} />}
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
      </div>
      {right}
    </div>
    {children}
  </div>
);

export const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,.1)",
      }}
    >
      <div style={{ color: C.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.fill, fontWeight: 700 }}>
          {p.value} {p.name}
        </div>
      ))}
    </div>
  );
};
