import { useState, useEffect, useMemo } from "react";
import { X, Target, Check, Edit2 } from "lucide-react";
import C from "../../constants/theme.js";
import { getFieldTargetsApi, setFieldTargetApi } from "./_shared.jsx";

export default function TargetsTab({ authUser, proMap, activities, isMobile }) {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [monthYear, setMonthYear] = useState(defaultMonth);
  const [targets, setTargets] = useState({}); // { pro_username: { target_visits, target_leads } }
  const [editing, setEditing] = useState({}); // { pro_username: { visits: N, leads: N } }
  const [saving, setSaving] = useState({}); // { pro_username: bool }
  const [saved, setSaved] = useState({}); // { pro_username: bool } — brief tick
  const [loadingT, setLoadingT] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  // Load targets whenever month changes
  useEffect(() => {
    setLoadingT(true);
    setErrMsg(null);
    getFieldTargetsApi(authUser.token, { monthYear })
      .then((r) => {
        if (!r.ok) return setErrMsg(r.error || "Failed to load targets");
        const map = {};
        (r.targets || []).forEach((t) => {
          map[t.pro_username] = t;
        });
        setTargets(map);
        setEditing({});
      })
      .finally(() => setLoadingT(false));
  }, [authUser.token, monthYear]);

  // Per-PRO actuals for selected month (from activities we already have)
  const monthActuals = useMemo(() => {
    const m = {};
    activities
      .filter((a) => (a.activity_date || "").startsWith(monthYear))
      .forEach((a) => {
        if (!m[a.pro_username]) m[a.pro_username] = { visits: 0, leads: 0, centre: a.centre };
        m[a.pro_username].visits++;
        m[a.pro_username].leads += a.leads_captured || 0;
      });
    return m;
  }, [activities, monthYear]);

  // All PROs seen in any activity (unique list)
  const allPros = useMemo(() => {
    const seen = {};
    activities.forEach((a) => {
      if (!seen[a.pro_username])
        seen[a.pro_username] = { username: a.pro_username, centre: a.centre };
    });
    return Object.values(seen).sort((a, b) => a.username.localeCompare(b.username));
  }, [activities]);

  const startEdit = (pro) => {
    const existing = targets[pro.username] || {};
    setEditing((e) => ({
      ...e,
      [pro.username]: {
        visits: existing.target_visits ?? 0,
        leads: existing.target_leads ?? 0,
      },
    }));
  };

  const cancelEdit = (username) => {
    setEditing((e) => {
      const n = { ...e };
      delete n[username];
      return n;
    });
  };

  const saveTarget = async (pro) => {
    const vals = editing[pro.username];
    if (!vals) return;
    setSaving((s) => ({ ...s, [pro.username]: true }));
    const r = await setFieldTargetApi(authUser.token, {
      proUsername: pro.username,
      monthYear,
      targetVisits: parseInt(vals.visits) || 0,
      targetLeads: parseInt(vals.leads) || 0,
      centre: pro.centre,
    });
    setSaving((s) => ({ ...s, [pro.username]: false }));
    if (r.ok) {
      setTargets((t) => ({ ...t, [pro.username]: r.target }));
      cancelEdit(pro.username);
      setSaved((s) => ({ ...s, [pro.username]: true }));
      setTimeout(
        () =>
          setSaved((s) => {
            const n = { ...s };
            delete n[pro.username];
            return n;
          }),
        1800
      );
    } else {
      setErrMsg(r.error || "Save failed");
    }
  };

  const monthLabel = new Date(monthYear + "-01").toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const ProgBar = ({ value, target, color }) => {
    const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    return (
      <div style={{ width: "100%", minWidth: isMobile ? 60 : 80 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>
          {value}/{target || "—"}
        </div>
        {target > 0 && (
          <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: 3,
                background: pct >= 100 ? C.success : color,
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Monthly Targets</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
            Set visit & lead targets per PRO for any month
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              color: C.text,
              background: C.card,
              outline: "none",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {errMsg && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#B91C1C",
          }}
        >
          {errMsg}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Desktop header */}
        {!isMobile && (
          <div
            style={{
              padding: "12px 18px",
              borderBottom: `1px solid ${C.border}`,
              background: "#F9FAFB",
              display: "grid",
              gridTemplateColumns: "1fr 100px 120px 120px 120px 80px",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              PRO · Centre
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Actual Visits
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Actual Leads
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Visit Target
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Lead Target
            </div>
            <div />
          </div>
        )}

        {loadingT ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            Loading targets…
          </div>
        ) : allPros.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            No PRO activity found. Targets can only be set for PROs who have logged at least one
            activity.
          </div>
        ) : (
          allPros.map((pro, i) => {
            const tgt = targets[pro.username] || {};
            const actual = monthActuals[pro.username] || { visits: 0, leads: 0 };
            const isEdit = !!editing[pro.username];
            const isSav = saving[pro.username];
            const wasSaved = saved[pro.username];
            const ev = editing[pro.username] || {};

            if (isMobile) {
              /* ── Mobile card layout ── */
              return (
                <div
                  key={pro.username}
                  style={{
                    borderBottom: i < allPros.length - 1 ? `1px solid ${C.border}` : "none",
                    padding: "14px 14px",
                    background: isEdit ? `${C.brand}06` : "transparent",
                    transition: "background .12s",
                  }}
                >
                  {/* PRO name + centre */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                        {pro.username.replace(/\.pro$/i, "").replace(/^\w/, (c) => c.toUpperCase())}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{pro.centre}</div>
                    </div>
                    {/* Edit / Save button top-right */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {isEdit ? (
                        <>
                          <button
                            onClick={() => cancelEdit(pro.username)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 7,
                              border: `1px solid ${C.border}`,
                              background: "transparent",
                              color: C.muted,
                              fontSize: 12,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => saveTarget(pro)}
                            disabled={isSav}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 7,
                              border: "none",
                              background: C.brand,
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isSav ? "not-allowed" : "pointer",
                              opacity: isSav ? 0.7 : 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {isSav ? (
                              "…"
                            ) : (
                              <>
                                <Check size={12} /> Save
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(pro)}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 7,
                            border: `1px solid ${C.border}`,
                            background: "transparent",
                            color: wasSaved ? C.success : C.muted,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {wasSaved ? (
                            <>
                              <Check size={12} /> Saved
                            </>
                          ) : (
                            <>
                              <Edit2 size={11} /> Set
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actuals row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px" }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          marginBottom: 4,
                        }}
                      >
                        Actual Visits
                      </div>
                      <ProgBar
                        value={actual.visits}
                        target={tgt.target_visits || 0}
                        color={C.brand}
                      />
                    </div>
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px" }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          marginBottom: 4,
                        }}
                      >
                        Actual Leads
                      </div>
                      <ProgBar value={actual.leads} target={tgt.target_leads || 0} color={C.info} />
                    </div>
                  </div>

                  {/* Target inputs row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          marginBottom: 4,
                        }}
                      >
                        Visit Target
                      </div>
                      {isEdit ? (
                        <input
                          type="number"
                          min="0"
                          value={ev.visits}
                          onChange={(e) =>
                            setEditing((ed) => ({
                              ...ed,
                              [pro.username]: { ...ed[pro.username], visits: e.target.value },
                            }))
                          }
                          style={{
                            width: "100%",
                            border: `1.5px solid ${C.brand}`,
                            borderRadius: 7,
                            padding: "8px 10px",
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.text,
                            background: C.card,
                            outline: "none",
                            textAlign: "center",
                            boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: tgt.target_visits ? C.text : C.faint,
                            padding: "6px 0",
                          }}
                        >
                          {tgt.target_visits || "—"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          marginBottom: 4,
                        }}
                      >
                        Lead Target
                      </div>
                      {isEdit ? (
                        <input
                          type="number"
                          min="0"
                          value={ev.leads}
                          onChange={(e) =>
                            setEditing((ed) => ({
                              ...ed,
                              [pro.username]: { ...ed[pro.username], leads: e.target.value },
                            }))
                          }
                          style={{
                            width: "100%",
                            border: `1.5px solid ${C.info}`,
                            borderRadius: 7,
                            padding: "8px 10px",
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.text,
                            background: C.card,
                            outline: "none",
                            textAlign: "center",
                            boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: tgt.target_leads ? C.text : C.faint,
                            padding: "6px 0",
                          }}
                        >
                          {tgt.target_leads || "—"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            /* ── Desktop grid row ── */
            return (
              <div
                key={pro.username}
                style={{
                  borderBottom: i < allPros.length - 1 ? `1px solid ${C.border}` : "none",
                  padding: "14px 18px",
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 120px 120px 120px 80px",
                  gap: 12,
                  alignItems: "center",
                  background: isEdit ? `${C.brand}05` : "transparent",
                  transition: "background .12s",
                }}
              >
                {/* PRO name */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                    {pro.username.replace(/\.pro$/i, "").replace(/^\w/, (c) => c.toUpperCase())}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{pro.centre}</div>
                </div>

                <ProgBar value={actual.visits} target={tgt.target_visits || 0} color={C.brand} />
                <ProgBar value={actual.leads} target={tgt.target_leads || 0} color={C.info} />

                {/* Visit target input */}
                <div>
                  {isEdit ? (
                    <input
                      type="number"
                      min="0"
                      value={ev.visits}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [pro.username]: { ...ed[pro.username], visits: e.target.value },
                        }))
                      }
                      style={{
                        width: "100%",
                        border: `1.5px solid ${C.brand}`,
                        borderRadius: 7,
                        padding: "6px 8px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        background: C.card,
                        outline: "none",
                        textAlign: "center",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: tgt.target_visits ? C.text : C.faint,
                      }}
                    >
                      {tgt.target_visits || "—"}
                    </div>
                  )}
                </div>

                {/* Lead target input */}
                <div>
                  {isEdit ? (
                    <input
                      type="number"
                      min="0"
                      value={ev.leads}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [pro.username]: { ...ed[pro.username], leads: e.target.value },
                        }))
                      }
                      style={{
                        width: "100%",
                        border: `1.5px solid ${C.info}`,
                        borderRadius: 7,
                        padding: "6px 8px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        background: C.card,
                        outline: "none",
                        textAlign: "center",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: tgt.target_leads ? C.text : C.faint,
                      }}
                    >
                      {tgt.target_leads || "—"}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {isEdit ? (
                    <>
                      <button
                        onClick={() => cancelEdit(pro.username)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 7,
                          border: `1px solid ${C.border}`,
                          background: "transparent",
                          color: C.muted,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => saveTarget(pro)}
                        disabled={isSav}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 7,
                          border: "none",
                          background: C.brand,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isSav ? "not-allowed" : "pointer",
                          opacity: isSav ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {isSav ? (
                          "…"
                        ) : (
                          <>
                            <Check size={12} /> Save
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(pro)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: `1px solid ${C.border}`,
                        background: "transparent",
                        color: wasSaved ? C.success : C.muted,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {wasSaved ? (
                        <>
                          <Check size={12} /> Saved
                        </>
                      ) : (
                        <>
                          <Edit2 size={11} /> Set
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: 11, color: C.faint }}>
        Targets for <strong>{monthLabel}</strong>. PROs see their progress bars on the Field Tracker
        app dashboard.
      </div>
    </div>
  );
}
