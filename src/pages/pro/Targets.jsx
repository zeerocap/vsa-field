import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty, FormError } from "../../components/ui.jsx";
import { getTargets } from "../../api/field.api.js";

function monthLabel(monthYear) {
  if (!monthYear) return "This month";
  const [y, m] = monthYear.split("-").map(Number);
  if (!y || !m) return monthYear;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function ProgressBar({ label, value, max, color = C.brand }) {
  const hasTarget = max > 0;
  const pct = hasTarget ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          fontSize: 12,
          color: C.text,
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span style={{ color: C.muted, fontWeight: 500 }}>
          {hasTarget ? `${value} / ${max}` : `${value} (no target set)`}
        </span>
      </div>
      <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            background: color,
            height: "100%",
            borderRadius: 99,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      {hasTarget && (
        <div
          style={{
            textAlign: "right",
            marginTop: 4,
            fontSize: 11,
            fontWeight: 600,
            color: pct >= 100 ? C.success : C.muted,
          }}
        >
          {pct}%
        </div>
      )}
    </div>
  );
}

export default function ProTargets() {
  const [loadErr, setLoadErr] = useState(null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTargets({})
      .then((r) => {
        // call() resolves with {ok:false} on failure rather than throwing, so the
        // .catch below never fires — check ok here or a backend outage silently
        // renders as "No targets set yet".
        if (!r.ok) {
          setLoadErr(r.error || "Could not load targets.");
          return;
        }
        setTargets(r.targets || []);
      })
      .catch((e) => setLoadErr(e.message || "Could not load. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  // A target row has no target when both visits and leads goals are zero.
  const hasAnyTarget = targets.some((t) => (t.target_visits || 0) > 0 || (t.target_leads || 0) > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormError msg={loadErr} />
      <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Targets</div>

      {!loadErr && !hasAnyTarget ? (
        <Empty msg="No targets set yet" icon="target" />
      ) : (
        targets
          .filter((t) => (t.target_visits || 0) > 0 || (t.target_leads || 0) > 0)
          .map((t, i) => (
            <Card key={t.month_year || i} style={{ padding: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 12 }}>
                {monthLabel(t.month_year)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ProgressBar
                  label="Visits"
                  value={t.achieved_visits || 0}
                  max={t.target_visits || 0}
                />
                <ProgressBar
                  label="Leads"
                  value={t.achieved_leads || 0}
                  max={t.target_leads || 0}
                />
              </div>
            </Card>
          ))
      )}
    </div>
  );
}
