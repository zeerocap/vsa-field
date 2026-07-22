// ─────────────────────────────────────────────────────────────────────────────
// Shared admin building blocks — constants, pure formatters, and the small
// presentational components reused across the admin section pages. Extracted
// from the old AdminPage monolith so each section can live in its own file.
// Depends only on the theme; never imports a section (no circular deps).
// ─────────────────────────────────────────────────────────────────────────────
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

// ── Pure formatters ──────────────────────────────────────────────────────────
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

export const KPICard = ({ icon: Icon, label, value, color, sub }) => (
  <div
    style={{
      background: C.card,
      borderRadius: 12,
      padding: "18px 20px",
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,.05)",
      display: "flex",
      flexDirection: "column",
      gap: 5,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `${color}12`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={18} color={color} strokeWidth={2} />
    </div>
    <div
      style={{
        fontSize: 12,
        color: C.muted,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: ".04em",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.faint }}>{sub}</div>}
  </div>
);

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
