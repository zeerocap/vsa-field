import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Btn, ProgressBar , FormError} from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getFieldDashboard, getTodayStatus, getTargets } from "../../api/field.api.js";
import { getUser } from "../../utils/auth.js";
import { useNavigate } from "react-router-dom";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function KpiCard({ label, value, icon, color, bg }) {
  return (
    <div style={{
      background: bg || C.card, borderRadius: 12, padding: "14px",
      border: `1px solid ${color}22`,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={15} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: color || C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, lineHeight: 1.3,
        textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

export default function ProDashboard() {
  const [loadErr, setLoadErr] = useState(null);
  const [data,    setData]    = useState(null);
  const [status,  setStatus]  = useState(null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav  = useNavigate();
  const user = getUser();

  useEffect(() => {
    Promise.all([getFieldDashboard(), getTodayStatus(), getTargets({})])
      .then(([d, s, t]) => {
        setData(d);
        setStatus(s);
        setTargets(t?.targets || []);
      })
      .catch(e => setLoadErr(e.message || "Could not load. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const checkedIn  = status?.checked_in;
  const venue      = status?.venue_name || "No venue";
  const since      = status?.check_in_time
    ? new Date(status.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const todayVisits = data?.todayActivities?.length ?? 0;
  const todayLeads  = data?.todayLeadsCount  ?? 0;
  const weekVisits  = data?.weekVisits       ?? 0;
  const weekLeads   = data?.weekLeadsCount   ?? 0;
  const monthName   = new Date().toLocaleString("default", { month: "short" });
  const monthVisits = data?.monthVisits      ?? 0;
  const monthLeads  = data?.monthLeadsCount  ?? 0;
  const recent      = data?.recentActivities || [];
  const firstName   = (user?.name || user?.username || "").split(" ")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FormError msg={loadErr} />

      {/* Greeting card */}
      <div style={{ padding: "4px 2px" }}>
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{formatDate()}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 2, lineHeight: 1.2 }}>
          {greeting()}, {firstName}!
        </div>
        {user?.district && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
            <Icon name="mappin" size={12} color={C.brand} />
            <span style={{ fontSize: 12, color: C.brand, fontWeight: 600 }}>{user.district}</span>
          </div>
        )}
      </div>

      {/* Check-in status card */}
      <Card style={{
        padding: "18px 20px",
        background: checkedIn
          ? "linear-gradient(135deg, #7e1749 0%, #4a0d2b 100%)"
          : "#fff",
        border: checkedIn ? "none" : `1px solid ${C.border}`,
        boxShadow: checkedIn
          ? "0 8px 24px rgba(126,23,73,0.35)"
          : "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: checkedIn ? "#4ade80" : "#D1D5DB",
                boxShadow: checkedIn ? "0 0 0 3px rgba(74,222,128,0.3)" : "none",
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                color: checkedIn ? "rgba(255,255,255,0.7)" : C.muted,
                textTransform: "uppercase" }}>
                {checkedIn ? "Active · Checked In" : "Not Checked In"}
              </span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800,
              color: checkedIn ? "#fff" : C.text }}>{venue}</div>
            {since && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>
                Since {since}
              </div>
            )}
          </div>
          <Btn
            onClick={() => nav("/checkin")}
            style={{
              background: checkedIn ? "rgba(255,255,255,0.15)" : C.brand,
              color: "#fff",
              border: checkedIn ? "1px solid rgba(255,255,255,0.3)" : "none",
              fontSize: 12, padding: "8px 14px",
            }}
          >
            {checkedIn ? "Check Out" : "Check In"}
          </Btn>
        </div>
      </Card>

      {/* KPI grid — 3×2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        <KpiCard label="Today Visits"         value={todayVisits}  icon="mappin"      color={C.brand} />
        <KpiCard label="Today Leads"          value={todayLeads}   icon="users"       color={C.success} />
        <KpiCard label="Week Visits"          value={weekVisits}   icon="clipboard"   color={C.info} />
        <KpiCard label="Week Leads"           value={weekLeads}    icon="target"      color="#7C3AED" />
        <KpiCard label={`${monthName} Visits`} value={monthVisits} icon="map"         color="#0891B2" />
        <KpiCard label={`${monthName} Leads`}  value={monthLeads}  icon="trending-up" color="#B45309" />
      </div>

      {/* Targets preview */}
      {targets.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Monthly Targets</div>
            <div onClick={() => nav("/targets")}
              style={{ fontSize: 12, color: C.brand, fontWeight: 600, cursor: "pointer" }}>
              View all →
            </div>
          </div>
          {targets.slice(0, 3).map((t, i) => (
            <div key={i} style={{ marginBottom: i < targets.slice(0,3).length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                marginBottom: 5, fontSize: 13, fontWeight: 600, color: C.text }}>
                <span>{t.metric_name || t.metric || "Target"}</span>
                <span style={{ fontWeight: 500, color: C.muted, fontSize: 12 }}>
                  {t.achieved ?? 0} / {t.target_value ?? 0}
                </span>
              </div>
              <ProgressBar
                value={t.achieved ?? t.current ?? 0}
                max={t.target_value ?? t.target ?? 0}
                showLabel={false}
                height={6}
              />
            </div>
          ))}
        </Card>
      )}

      {/* Quick actions */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "clipboard",   label: "Log Activity", path: "/activities", color: C.brand },
            { icon: "users",       label: "Add Lead",     path: "/leads",      color: C.success },
            { icon: "wallet",      label: "Log Expense",  path: "/expenses",   color: C.warning },
            { icon: "building",    label: "My Venues",    path: "/venues",     color: C.info },
          ].map(a => (
            <div key={a.path} onClick={() => nav(a.path)}
              style={{ background: a.color + "0D", borderRadius: 12, padding: "14px 12px",
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                border: `1px solid ${a.color}20`, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: a.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={a.icon} size={18} color={a.color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activities */}
      {recent.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Recent Activities</div>
            <div onClick={() => nav("/activities")}
              style={{ fontSize: 12, color: C.brand, fontWeight: 600, cursor: "pointer" }}>
              View all →
            </div>
          </div>
          {recent.slice(0, 5).map((a, i) => (
            <div key={i} style={{ padding: "10px 0", display: "flex",
              justifyContent: "space-between", alignItems: "flex-start",
              borderBottom: i < Math.min(recent.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {a.venue_name || a.activity_type?.replace(/_/g," ") || "Activity"}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {a.activity_type?.replace(/_/g," ")}
                  {a.leads_captured ? ` · ${a.leads_captured} lead${a.leads_captured !== 1 ? "s" : ""}` : ""}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.muted, textAlign: "right", marginLeft: 8, flexShrink: 0 }}>
                {new Date(a.activity_date || a.created_at).toLocaleDateString("en-IN",
                  { day: "numeric", month: "short" })}
              </div>
            </div>
          ))}
        </Card>
      )}

      <div style={{ height: 4 }} />
    </div>
  );
}
