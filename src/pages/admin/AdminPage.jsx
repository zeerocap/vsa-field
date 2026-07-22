import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Navigation, RefreshCw } from "lucide-react";
import C from "../../constants/theme.js";
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
import { getFieldActivitiesApi } from "./_shared.jsx";

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

function FieldMarketingInner({ authUser, isMobile }) {
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1);
    return ADMIN_TAB_IDS.includes(h) ? h : "overview";
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAct, setSelectedAct] = useState(null);

  // Keep the section in sync with the URL hash the sidebar sets.
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
