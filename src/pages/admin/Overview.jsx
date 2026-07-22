import { useMemo } from "react";
import {
  MapPin,
  Users,
  Clock,
  Award,
  Activity,
  ChevronRight,
  Target,
  AlertTriangle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import C from "../../constants/theme.js";
import {
  ChartTip,
  KPICard,
  Pill,
  SectionCard,
  daysSince,
  displayName,
  fmtDate,
  typeLabel,
} from "./_shared.jsx";

export default function OverviewTab({
  activities,
  proMap,
  totalLeads,
  totalActs,
  activePros,
  venuesCovered,
  isMobile,
  onSelectActivity,
  onChangeTab,
}) {
  // 30-day daily trend
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      days.push({ date: key, label, leads: 0, acts: 0 });
    }
    const map = {};
    days.forEach((d) => {
      map[d.date] = d;
    });
    activities.forEach((a) => {
      if (map[a.activity_date]) {
        map[a.activity_date].leads += a.leads_captured || 0;
        map[a.activity_date].acts++;
      }
    });
    return days;
  }, [activities]);

  // Activity type breakdown
  const typeData = useMemo(() => {
    const m = {};
    activities.forEach((a) => {
      const t = typeLabel(a.activity_type);
      if (!m[t]) m[t] = { type: t, count: 0, leads: 0 };
      m[t].count++;
      m[t].leads += a.leads_captured || 0;
    });
    return Object.values(m)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [activities]);

  const maxCount = Math.max(1, ...typeData.map((t) => t.count));
  const typeColors = [C.brand, C.info, C.purple, C.success, C.warning, "#F43F5E"];

  const avgLeads = totalActs > 0 ? (totalLeads / totalActs).toFixed(1) : "0";
  const lateCount = activities.filter((a) => a.is_late_entry).length;

  // This-week slice
  const wk = new Date();
  wk.setDate(wk.getDate() - 7);
  const wkStr = wk.toISOString().slice(0, 10);
  const weekActs = activities.filter((a) => a.activity_date >= wkStr);
  const weekLeads = weekActs.reduce((s, a) => s + (a.leads_captured || 0), 0);

  const MEDAL_COLORS = [C.warning, C.muted, "#B45309"];
  const MedalBadge = ({ rank }) => (
    <span style={{ fontSize: 11, fontWeight: 800, color: MEDAL_COLORS[rank] || C.faint }}>
      {rank + 1}
    </span>
  );

  return (
    <div>
      {/* ── KPI row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <KPICard
          icon={Activity}
          label="Total Activities"
          value={totalActs}
          color={C.brand}
          sub={`${weekActs.length} this week`}
        />
        <KPICard
          icon={Target}
          label="Leads Captured"
          value={totalLeads}
          color={C.info}
          sub={`${weekLeads} this week`}
        />
        <KPICard
          icon={Users}
          label="Active PROs"
          value={activePros}
          color={C.success}
          sub="All centres"
        />
        <KPICard
          icon={MapPin}
          label="Venues Covered"
          value={venuesCovered}
          color={C.purple}
          sub={`Avg ${avgLeads} leads/visit`}
        />
      </div>

      {/* ── Charts row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* 30-day bar chart */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Leads Trend</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                Last 30 days · daily breakdown
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.brand }}>{totalLeads}</div>
              <div style={{ fontSize: 10, color: C.muted }}>total leads</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={trendData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: C.muted }}
                tickLine={false}
                axisLine={false}
                interval={isMobile ? 7 : 4}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: `${C.brand}08` }} />
              <Bar dataKey="leads" name="leads" fill={C.brand} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity type breakdown */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>
            By Activity Type
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
            All time · visits & leads
          </div>
          {typeData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {typeData.map((t, i) => {
                const col = typeColors[i];
                const pct = Math.round((t.count / maxCount) * 100);
                return (
                  <div key={t.type}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{t.type}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        <strong style={{ color: col }}>{t.count}</strong> visits ·{" "}
                        <strong style={{ color: C.brand }}>{t.leads}</strong> leads
                      </span>
                    </div>
                    <div style={{ height: 5, background: C.border, borderRadius: 3 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: col,
                          borderRadius: 3,
                          transition: "width .4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {lateCount > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertTriangle size={13} color={C.warning} />
              <span style={{ fontSize: 11, color: C.warning, fontWeight: 600 }}>
                {lateCount} late {lateCount === 1 ? "entry" : "entries"} recorded
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── PRO Leaderboard ── */}
      <SectionCard
        title="PRO Leaderboard"
        icon={Award}
        right={<span style={{ fontSize: 11, color: C.muted }}>All time · ranked by leads</span>}
      >
        {proMap.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 13 }}>
            No activities yet
          </div>
        ) : isMobile ? (
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {proMap.slice(0, 10).map((p, i) => {
              const pct = Math.round((p.leads / (proMap[0]?.leads || 1)) * 100);
              const rankBg = i === 0 ? "#FFFBF0" : C.bg;
              return (
                <div
                  key={p.username}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: rankBg,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: `${C.brand}10`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MedalBadge rank={i} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                        {displayName(p.username)}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>{p.centre}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.brand }}>{p.leads}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>leads</div>
                    </div>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: C.brand,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["", "PRO", "Centre", "Activities", "Leads", "Avg/Visit", "Last Active"].map(
                  (h) => (
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
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {proMap.slice(0, 15).map((p, i) => {
                const pct = Math.round((p.leads / (proMap[0]?.leads || 1)) * 100);
                return (
                  <tr
                    key={p.username}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: i === 0 ? "#FFFDF0" : "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF8FB")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = i === 0 ? "#FFFDF0" : "transparent")
                    }
                  >
                    <td style={{ padding: "10px 16px", width: 44 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: `${C.brand}0D`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MedalBadge rank={i} />
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                        {displayName(p.username)}
                      </div>
                      <div style={{ fontSize: 11, color: C.faint }}>{p.username}</div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <Pill label={p.centre || "—"} color={C.info} />
                    </td>
                    <td
                      style={{ padding: "10px 16px", fontSize: 14, fontWeight: 700, color: C.text }}
                    >
                      {p.acts}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 56,
                            height: 5,
                            background: C.border,
                            borderRadius: 3,
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: C.brand,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: C.brand }}>
                          {p.leads}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: C.text }}>
                      {p.acts > 0 ? (p.leads / p.acts).toFixed(1) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontSize: 12,
                        color: C.success,
                        fontWeight: 500,
                      }}
                    >
                      {daysSince(p.lastDate) || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* ── Recent Activities ── */}
      <SectionCard
        title="Recent Activities"
        icon={Clock}
        right={
          <button
            onClick={() => onChangeTab("activities")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: C.brand,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            View all <ChevronRight size={13} />
          </button>
        }
      >
        {isMobile ? (
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {activities.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, color: C.muted, fontSize: 13 }}>
                No activities logged yet
              </div>
            )}
            {activities.slice(0, 6).map((a) => (
              <div
                key={a.id}
                onClick={() => onSelectActivity(a)}
                style={{
                  padding: "11px 13px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6,
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
                      {a.venue_name || "Unknown"}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {displayName(a.pro_username)} · {fmtDate(a.activity_date)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: (a.leads_captured || 0) > 0 ? C.brand : C.muted,
                      }}
                    >
                      {a.leads_captured || 0}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted }}>leads</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <Pill label={typeLabel(a.activity_type)} color={C.purple} />
                  {a.is_late_entry && <Pill label="Late" color={C.warning} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Date", "PRO", "Venue", "Type", "Leads", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 16px",
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
                {activities.slice(0, 8).map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => onSelectActivity(a)}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF8FB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      style={{
                        padding: "9px 16px",
                        fontSize: 12,
                        color: C.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(a.activity_date)}
                    </td>
                    <td
                      style={{ padding: "9px 16px", fontSize: 12, fontWeight: 600, color: C.text }}
                    >
                      {displayName(a.pro_username)}
                    </td>
                    <td
                      style={{
                        padding: "9px 16px",
                        fontSize: 12,
                        color: C.text,
                        maxWidth: 170,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={a.venue_name}
                    >
                      {a.venue_name || "—"}
                    </td>
                    <td style={{ padding: "9px 16px" }}>
                      <Pill label={typeLabel(a.activity_type)} color={C.purple} />
                    </td>
                    <td style={{ padding: "9px 16px" }}>
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
                      style={{ padding: "9px 16px", fontSize: 11, color: C.brand, fontWeight: 600 }}
                    >
                      View
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: 36, color: C.muted, fontSize: 13 }}
                    >
                      No activities logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
