import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty } from "../../components/ui.jsx";
import { getTargets } from "../../api/field.api.js";

function ProgressBar({ value, max, color = C.accent }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div>
      <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: C.muted }}>
        <span>{value} / {max}</span>
        <span style={{ fontWeight: 600, color: pct >= 100 ? C.success : C.text }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function ProTargets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTargets({}).then(r => setTargets(r?.targets || r || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Targets</div>

      {targets.length === 0 ? <Empty msg="No targets set yet" icon="target" /> : targets.map((t, i) => (
        <Card key={i} style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{t.metric_name || t.metric || "Target"}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{t.period || "Monthly"}</div>
          </div>
          <ProgressBar
            value={t.achieved ?? t.current ?? 0}
            max={t.target_value ?? t.target ?? 0}
            color={(t.achieved ?? 0) >= (t.target_value ?? 1) ? C.success : C.accent}
          />
          {t.notes && <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>{t.notes}</div>}
        </Card>
      ))}
    </div>
  );
}
