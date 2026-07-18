import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import C from "../../constants/theme.js";
import { Spinner } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getActivities, getUsers, getSessions } from "../../api/field.api.js";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = d =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const daysSince = d => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d + "T00:00:00")) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
};

const displayName = u => {
  if (!u) return "—";
  const n = (u.name || u.username || "").replace(/\.pro$/i, "");
  return n.charAt(0).toUpperCase() + n.slice(1);
};

const typeLabel = v => v ? v.replace(/_/g, " ") : "—";

// ─── sub-components ───────────────────────────────────────────────────────────
const KPICard = ({ label, value, color, sub, icon }) => (
  <div style={{
    background: C.card, borderRadius: 12, padding: "18px 20px",
    border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,.05)",
    display: "flex", flexDirection: "column", gap: 5, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 14, right: 14, width: 36, height: 36,
      borderRadius: 10, background: `${color}12`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon name={icon} size={18} color={color} />
    </div>
    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.faint }}>{sub}</div>}
  </div>
);

const SectionCard = ({ title, right, children }) => (
  <div style={{
    background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
    overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.05)", marginBottom: 14,
  }}>
    <div style={{
      padding: "13px 20px", borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
      {right}
    </div>
    {children}
  </div>
);

const Pill = ({ label, color = C.brand }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", padding: "2px 9px",
    borderRadius: 20, background: `${color}15`, color,
    fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
  }}>{label}</span>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "8px 12px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,.1)",
    }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.fill, fontWeight: 700 }}>
          {p.value} {p.name}
        </div>
      ))}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activities, setActivities] = useState([]);
  const [users,      setUsers]      = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      getActivities({ limit: 500 }),
      getUsers(),
      getSessions({}),
    ])
      .then(([a, u, s]) => {
        setActivities(a?.activities || a || []);
        setUsers(u?.users || u || []);
        setSessions(s?.sessions || s || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── computed KPIs ─────────────────────────────────────────────────────────
  const pros         = useMemo(() => users.filter(u => u.role === "pro"), [users]);
  const totalLeads   = useMemo(() => activities.reduce((s, a) => s + (a.leads_captured || 0), 0), [activities]);
  const venueIds     = useMemo(() => new Set(activities.map(a => a.venue_id).filter(Boolean)).size, [activities]);
  const activeSess   = useMemo(() => sessions.filter(s => !s.checkout_time && !s.check_out_time), [sessions]);

  const wk           = new Date(); wk.setDate(wk.getDate() - 7);
  const wkStr        = wk.toISOString().slice(0, 10);
  const weekActs     = useMemo(() => activities.filter(a => a.activity_date >= wkStr), [activities, wkStr]);
  const weekLeads    = useMemo(() => weekActs.reduce((s, a) => s + (a.leads_captured || 0), 0), [weekActs]);

  // ── 30-day trend ──────────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      days.push({ date: key, label, leads: 0, acts: 0 });
    }
    const map = {};
    days.forEach(d => { map[d.date] = d; });
    activities.forEach(a => {
      if (map[a.activity_date]) {
        map[a.activity_date].leads += a.leads_captured || 0;
        map[a.activity_date].acts++;
      }
    });
    return days;
  }, [activities]);

  // ── activity type breakdown ───────────────────────────────────────────────
  const typeData = useMemo(() => {
    const m = {};
    activities.forEach(a => {
      const t = typeLabel(a.activity_type || a.type);
      if (!m[t]) m[t] = { type: t, count: 0, leads: 0 };
      m[t].count++;
      m[t].leads += a.leads_captured || 0;
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [activities]);
  const maxCount = Math.max(1, ...typeData.map(t => t.count));
  const typeColors = [C.brand, C.info, C.purple, C.success, C.warning, "#F43F5E"];

  // ── PRO leaderboard ───────────────────────────────────────────────────────
  const leaderboard = useMemo(() => {
    const m = {};
    activities.forEach(a => {
      const key = a.pro_username || a.user_name;
      if (!key) return;
      if (!m[key]) m[key] = { username: key, centre: a.centre || "—", acts: 0, leads: 0, lastDate: null };
      m[key].acts++;
      m[key].leads += a.leads_captured || 0;
      if (!m[key].lastDate || a.activity_date > m[key].lastDate) m[key].lastDate = a.activity_date;
    });
    return Object.values(m).sort((a, b) => b.leads - a.leads);
  }, [activities]);

  const MEDAL = ["#D97706", "#6B7280", "#B45309"];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Spinner />
    </div>
  );

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Field Overview</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>All-time · field marketing performance</div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <KPICard icon="clipboard" label="Total Activities" value={activities.length} color={C.brand}  sub={`${weekActs.length} this week`} />
        <KPICard icon="users" label="Leads Captured"   value={totalLeads}        color={C.info}   sub={`${weekLeads} this week`} />
        <KPICard icon="activity" label="Live Sessions"    value={activeSess.length} color={C.success} sub={`${pros.length} total PROs`} />
        <KPICard icon="building" label="Venues Covered"   value={venueIds}          color={C.purple} sub={activities.length > 0 ? `Avg ${(totalLeads / activities.length).toFixed(1)} leads/visit` : "—"} />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12, marginBottom: 14 }}>

        {/* 30-day trend */}
        <div style={{
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Leads Trend</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Last 30 days · daily breakdown</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.brand }}>{totalLeads}</div>
              <div style={{ fontSize: 10, color: C.muted }}>total leads</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={trendData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} interval={6} />
              <YAxis hide allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: `${C.brand}08` }} />
              <Bar dataKey="leads" name="leads" fill={C.brand} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity type breakdown */}
        <div style={{
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>By Activity Type</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>All time · visits & leads</div>
          {typeData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 13 }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {typeData.map((t, i) => {
                const col = typeColors[i];
                const pct = Math.round((t.count / maxCount) * 100);
                return (
                  <div key={t.type}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{t.type}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        <strong style={{ color: col }}>{t.count}</strong> visits ·{" "}
                        <strong style={{ color: C.brand }}>{t.leads}</strong> leads
                      </span>
                    </div>
                    <div style={{ height: 5, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 3, transition: "width .4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── PRO Leaderboard ── */}
      <SectionCard
        title="PRO Leaderboard"
        right={<span style={{ fontSize: 11, color: C.muted }}>All time · ranked by leads</span>}
      >
        {leaderboard.length === 0 ? (
          <div style={{ textAlign: "center", padding: 36, color: C.muted, fontSize: 13 }}>No activities yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["", "PRO", "Centre", "Activities", "Leads", "Avg/Visit", "Last Active"].map(h => (
                  <th key={h} style={{
                    padding: "9px 16px", textAlign: "left", fontSize: 11,
                    fontWeight: 600, color: C.muted, letterSpacing: .4,
                    borderBottom: `1px solid ${C.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, 15).map((p, i) => {
                const pct = Math.round((p.leads / (leaderboard[0]?.leads || 1)) * 100);
                return (
                  <tr key={p.username}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: i === 0 ? "#FFFDF0" : "transparent",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF8FB"}
                    onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "#FFFDF0" : "transparent"}>
                    <td style={{ padding: "10px 16px", width: 44 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: `${C.brand}0D`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: MEDAL[i] || C.muted }}>{i + 1}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{displayName(p)}</div>
                      <div style={{ fontSize: 11, color: C.faint }}>{p.username}</div>
                    </td>
                    <td style={{ padding: "10px 16px" }}><Pill label={p.centre} color={C.info} /></td>
                    <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 700, color: C.text }}>{p.acts}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 56, height: 5, background: C.border, borderRadius: 3, flexShrink: 0 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: C.brand, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: C.brand }}>{p.leads}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>
                      {p.acts > 0 ? (p.leads / p.acts).toFixed(1) : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: C.success, fontWeight: 500 }}>
                      {daysSince(p.lastDate) || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* ── Live PRO Status ── */}
      <SectionCard
        title="Live PRO Status"
        right={
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, color: activeSess.length > 0 ? C.success : C.muted, fontWeight: 600,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: activeSess.length > 0 ? C.success : C.faint,
              display: "inline-block",
            }} />
            {activeSess.length} active
          </span>
        }
      >
        {pros.length === 0 ? (
          <div style={{ textAlign: "center", padding: 36, color: C.muted, fontSize: 13 }}>No PRO users found</div>
        ) : (
          <div style={{ padding: "4px 0" }}>
            {pros.map((u, i) => {
              const live = activeSess.find(s =>
                s.user_id === u.id ||
                s.user_name === u.username ||
                s.user_name === (u.name || u.username)
              );
              return (
                <div key={u.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 20px",
                  borderBottom: i < pros.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: live ? `${C.success}15` : C.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: live ? C.success : C.muted,
                      border: `2px solid ${live ? C.success : C.border}`,
                      flexShrink: 0,
                    }}>
                      {displayName(u).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{displayName(u)}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{u.centre || "—"}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {live ? (
                      <>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: `${C.success}12`, color: C.success,
                          borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
                        }}>
                          ● ACTIVE
                        </span>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                          {live.venue_name || "Unknown venue"}
                        </div>
                      </>
                    ) : (
                      <span style={{
                        background: C.bg, color: C.faint,
                        borderRadius: 20, padding: "3px 10px", fontSize: 11,
                      }}>Offline</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Recent Activities ── */}
      <SectionCard title="Recent Activities">
        {activities.length === 0 ? (
          <div style={{ textAlign: "center", padding: 36, color: C.muted, fontSize: 13 }}>No activities logged yet</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Date", "PRO", "Venue", "Type", "Leads"].map(h => (
                    <th key={h} style={{
                      padding: "9px 16px", textAlign: "left", fontSize: 11,
                      fontWeight: 600, color: C.muted, letterSpacing: .4,
                      borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 10).map((a, i) => (
                  <tr key={a.id || i}
                    style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF8FB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>
                      {fmtDate(a.activity_date)}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, color: C.text }}>
                      {displayName({ name: a.user_name, username: a.pro_username })}
                    </td>
                    <td style={{
                      padding: "10px 16px", fontSize: 12, color: C.text,
                      maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }} title={a.venue_name}>{a.venue_name || "—"}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <Pill label={typeLabel(a.activity_type || a.type)} color={C.purple} />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: 15, fontWeight: 800,
                        color: (a.leads_captured || 0) > 0 ? C.brand : C.muted,
                      }}>{a.leads_captured || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
