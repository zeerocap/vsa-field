import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";
const GMAP_KEY = import.meta.env.VITE_GMAP_KEY || "";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  X,
  MapPin,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Activity,
  ChevronRight,
  Filter,
  Navigation,
  Target,
  AlertTriangle,
  Phone,
  Check,
  Edit2,
  Wifi,
  Camera,
  Layers,
  Building2,
  GraduationCap,
  BookOpen,
  Store,
  User,
  Sun,
  Map,
  RefreshCw,
  Pin,
  ShieldCheck,
  ShieldAlert,
  ScanFace,
  CheckCircle,
  AlertCircle,
  Route,
  Footprints,
  LocateFixed,
  Timer,
  LayoutDashboard,
} from "lucide-react";
import C from "../../constants/theme.js";
import { call } from "../../utils/api.js";
import { getUser, getToken } from "../../utils/auth.js";
import ExpensesTab from "./Expenses.jsx";
import TrailTab from "./Trail.jsx";
import FaceIdTab from "./FaceId.jsx";
import AdminMapTab from "./AdminMap.jsx";
import PhotosTab from "./Photos.jsx";
import TerritoryAdminTab from "./Territory.jsx";
import LiveTab from "./Live.jsx";
import TargetsTab from "./Targets.jsx";
import VenuesTab from "./Venues.jsx";
import ActivitiesTab from "./Activities.jsx";
import OverviewTab from "./Overview.jsx";
import ProMarker from "./ProMarker.jsx";
import PinLocationModal from "./PinLocationModal.jsx";
import EnrollFaceModal from "./EnrollFaceModal.jsx";
import ActivityDetailDrawer from "./ActivityDetailDrawer.jsx";
import LoginSelfiesTab from "./LoginSelfies.jsx";
import SessionsTab from "./Sessions.jsx";
import FieldLeadsTab from "./Leads.jsx";

// ── Inline constants ──────────────────────────────────────────────────────────
const KERALA_DISTRICTS = [
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
const ACTIVITY_TYPES = [
  { value: "school_visit", label: "School Visit" },
  { value: "mall_activation", label: "Mall Activation" },
  { value: "event", label: "Event" },
  { value: "door_to_door", label: "Door to Door" },
  { value: "other", label: "Other" },
];

// ── API adapters — call() handles token internally ────────────────────────────
const _fa = (action) => async (_t, params) => call(action, params || {});
const getFieldActivitiesApi = _fa("getFieldActivities");
const getFieldVenuesApi = async (_t, params) => call("getFieldVenues", params || {});
const addFieldVenueApi = _fa("addFieldVenue");
const getFieldLeadsApi = _fa("getFieldLeads");
const getFieldTargetsApi = async (_t, params) => call("getFieldTargets", params || {});
const setFieldTargetApi = _fa("setFieldTarget");
const getLiveSessionsApi = async () => call("getLiveSessions");
const getTerritoriesApi = async () => call("getTerritories");
const setTerritoryApi = _fa("setTerritory");
const getFieldPhotosApi = _fa("getFieldPhotos");
const setVenueLocationApi = _fa("setVenueLocation");
const getFieldSessionsApi = _fa("getFieldSessions");
const getLoginSelfiesApi = _fa("getLoginSelfies");
const getProTrailApi = _fa("getProTrail");
const getTrailSummaryApi = _fa("getTrailSummary");
const fetchUsersApi = async () => call("getUsers");
const revokeFaceApi = _fa("revokeFace");
const _enrollFaceApi = _fa("enrollFace");

// ── Simplified EnrollFaceModal (camera photo capture, no face-api.js) ────────

// ── Simplified ActivityDetailDrawer ───────────────────────────────────────────

// ─── Pure helpers (outside component for stable refs) ────────────────────────
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const daysSince = (d) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d + "T00:00:00")) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
};

const typeLabel = (v) =>
  ACTIVITY_TYPES?.find((t) => t.value === v)?.label || (v ? v.replace(/_/g, " ") : "—");

const displayName = (u) => {
  if (!u) return "—";
  const n = u.replace(/\.pro$/i, "");
  return n.charAt(0).toUpperCase() + n.slice(1);
};

// Status colours for field leads (matches CRM)
const STATUS_COLOR = {
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

// ─── Shared micro-components ─────────────────────────────────────────────────
const Pill = ({ label, color = C.brand }) => (
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

const KPICard = ({ icon: Icon, label, value, color, sub }) => (
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

const SectionCard = ({ title, icon: Icon, right, children }) => (
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

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
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

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

// ─── ACTIVITIES TAB ───────────────────────────────────────────────────────────

// ─── VENUES TAB ───────────────────────────────────────────────────────────────
// ─── Pin Location Modal — Google Maps picker ──────────────────────────────────

// ─── FIELD LEADS TAB ─────────────────────────────────────────────────────────

// ─── helpers for Leaflet custom markers ──────────────────────────────────────
// ─── Google Maps PRO marker (custom HTML overlay) ─────────────────────────────

const GMAP_OPTIONS = {
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

// ─── LIVE TAB ─────────────────────────────────────────────────────────────────

// ─── TERRITORY ADMIN TAB ──────────────────────────────────────────────────────

// ─── PHOTOS TAB ───────────────────────────────────────────────────────────────

// ── Admin District Heatmap ────────────────────────────────────────────────────
const KERALA_DISTRICT_CENTERS = {
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

// ─── SESSIONS TAB — Trust Score + Fraud Flags ────────────────────────────────

// ─── TrailTab — Google Maps Timeline-quality PRO route viewer ────────────────
const TRAIL_MAP_OPTS = {
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

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
function fmtDuration(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60),
    m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Reverse geocode a stop using OpenStreetMap Nominatim (free, no key needed)
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=17`,
      { headers: { "Accept-Language": "en" } }
    );
    const d = await r.json();
    if (d?.display_name) {
      const parts = d.display_name.split(",").map((s) => s.trim());
      // Return the 2 most local parts (e.g. "Shop Name, Street Name")
      return parts.slice(0, 2).join(", ");
    }
  } catch {
    /* silent */
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Tab ids were repeated in three places in this file and again in Layout.jsx, and
// had to be kept in sync by hand. Exported so Layout can import the same list.
export const ADMIN_TAB_IDS = [
  "overview",
  "activities",
  "live",
  "trail",
  "sessions",
  "venues",
  "leads",
  "targets",
  "expenses",
  "map",
  "territory",
  "photos",
  "logins",
  "faceid",
];

// ── Expenses ────────────────────────────────────────────────────────────────
// reviewFieldExpense existed on the backend but no frontend ever called it, so
// every claim a PRO submitted sat at "pending" forever with no way to action it.
function FieldMarketingInner({ authUser, isMobile }) {
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1);
    return ADMIN_TAB_IDS.includes(h) ? h : "overview";
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAct, setSelectedAct] = useState(null);

  useEffect(() => {
    function onHash() {
      const h = window.location.hash.slice(1);
      if (ADMIN_TAB_IDS.includes(h)) setTab(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    function onHash() {
      const h = window.location.hash.slice(1);
      if (ADMIN_TAB_IDS.includes(h)) setTab(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const loadActivities = useCallback(() => {
    setLoading(true);
    getFieldActivitiesApi(authUser.token, { limit: 500 })
      .then((r) => {
        if (r.ok) setActivities(r.activities || []);
      })
      .finally(() => setLoading(false));
  }, [authUser.token]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleRefresh = () => {
    setRefreshing(true);
    getFieldActivitiesApi(authUser.token, { limit: 500 })
      .then((r) => {
        if (r.ok) setActivities(r.activities || []);
      })
      .finally(() => setRefreshing(false));
  };

  // Aggregate PRO stats from all activities
  const proMap = useMemo(() => {
    const m = {};
    activities.forEach((a) => {
      if (!m[a.pro_username])
        m[a.pro_username] = {
          username: a.pro_username,
          centre: a.centre,
          acts: 0,
          leads: 0,
          lastDate: "",
        };
      m[a.pro_username].acts++;
      m[a.pro_username].leads += a.leads_captured || 0;
      if (!m[a.pro_username].lastDate || a.activity_date > m[a.pro_username].lastDate)
        m[a.pro_username].lastDate = a.activity_date;
    });
    return Object.values(m).sort((a, b) => b.leads - a.leads);
  }, [activities]);

  const totalLeads = activities.reduce((s, a) => s + (a.leads_captured || 0), 0);
  const totalActs = activities.length;
  const activePros = proMap.length;
  const venuesCovered = [...new Set(activities.map((a) => a.venue_name).filter(Boolean))].length;

  return (
    <div style={{ maxWidth: "100%" }}>
      <style>{`
        @keyframes _livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── Page header — responsive ── */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: `${C.brand}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Navigation size={17} color={C.brand} />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: C.text }}>
              Field Marketing
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                PRO activities, leads and venues · all centres
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {!loading && totalActs > 0 && (
            <div style={{ display: "flex", gap: isMobile ? 10 : 16, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  Leads
                </div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.brand }}>
                  {totalLeads}
                </div>
              </div>
              <div style={{ width: 1, height: 24, background: C.border }} />
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  Acts
                </div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.text }}>
                  {totalActs}
                </div>
              </div>
              <div style={{ width: 1, height: 24, background: C.border }} />
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  PROs
                </div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.success }}>
                  {activePros}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              opacity: refreshing || loading ? 0.5 : 1,
            }}
          >
            <RefreshCw
              size={13}
              style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }}
            />
          </button>
        </div>
      </div>

      {/* Navigation is the sidebar (Layout.jsx). The internal top tab bar that
          this page carried over from its CRM-page origins was removed — it
          duplicated the sidebar and the two had drifted out of sync. Section
          selection is still driven by the URL hash the sidebar sets. */}

      {/* ── Section content ── */}
      {tab === "overview" &&
        (loading ? (
          <div style={{ textAlign: "center", padding: 80, color: C.muted, fontSize: 14 }}>
            Loading field data…
          </div>
        ) : (
          <OverviewTab
            activities={activities}
            proMap={proMap}
            totalLeads={totalLeads}
            totalActs={totalActs}
            activePros={activePros}
            venuesCovered={venuesCovered}
            isMobile={isMobile}
            onSelectActivity={setSelectedAct}
            onChangeTab={setTab}
          />
        ))}

      {tab === "activities" && (
        <ActivitiesTab
          activities={activities}
          authUser={authUser}
          isMobile={isMobile}
          onSelectActivity={setSelectedAct}
          loading={loading}
        />
      )}

      {tab === "sessions" && <SessionsTab authUser={authUser} isMobile={isMobile} />}
      {tab === "logins" && <LoginSelfiesTab authUser={authUser} isMobile={isMobile} />}
      {tab === "venues" && <VenuesTab authUser={authUser} isMobile={isMobile} />}
      {tab === "leads" && <FieldLeadsTab authUser={authUser} isMobile={isMobile} />}
      {tab === "targets" && (
        <TargetsTab
          authUser={authUser}
          proMap={proMap}
          activities={activities}
          isMobile={isMobile}
        />
      )}
      {tab === "live" && <LiveTab authUser={authUser} isMobile={isMobile} />}
      {tab === "map" && <AdminMapTab activities={activities} isMobile={isMobile} />}
      {tab === "territory" && (
        <TerritoryAdminTab authUser={authUser} proMap={proMap} isMobile={isMobile} />
      )}
      {tab === "photos" && <PhotosTab authUser={authUser} proMap={proMap} isMobile={isMobile} />}
      {tab === "faceid" && <FaceIdTab authUser={authUser} isMobile={isMobile} />}
      {tab === "expenses" && <ExpensesTab />}
      {tab === "trail" && <TrailTab authUser={authUser} proMap={proMap} isMobile={isMobile} />}

      {/* ── Activity detail drawer ── */}
      {selectedAct && (
        <ActivityDetailDrawer
          activity={selectedAct}
          onClose={() => setSelectedAct(null)}
          isMobile={isMobile}
          authToken={authUser.token}
        />
      )}
    </div>
  );
}

// ── Default export — creates authUser from vsa-field auth ────────────────────
export default function AdminPage() {
  const user = getUser();
  const token = getToken();
  // Memoised: this object used to be rebuilt on every render, so a useCallback
  // keyed on [authUser] never memoised and FaceIdTab refetched in a loop.
  const authUser = React.useMemo(
    () => ({ ...(user || {}), token: token || "" }),
    [user?.username, token]
  );
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return <FieldMarketingInner authUser={authUser} isMobile={isMobile} />;
}
