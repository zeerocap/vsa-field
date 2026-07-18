import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import { getTargets, setTarget, getUsers } from "../../api/field.api.js";

const METRICS = ["Venue Visits","Field Leads","Activities","Demos","Events","Expenses (₹)"];

function Bar({ value, max }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ background: C.border, borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: pct >= 100 ? "#388e3c" : C.accent, height: "100%", borderRadius: 99 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginTop: 3 }}>
        <span>{value} / {max}</span><span style={{ fontWeight: 600, color: pct >= 100 ? "#388e3c" : C.text }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function AdminTargets() {
  const [targets, setTargets] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ user_id: "", metric: "Venue Visits", target_value: "", period: "monthly" });

  const load = () => {
    Promise.all([getTargets({}), getUsers()])
      .then(([t, u]) => { setTargets(t?.targets || t || []); setUsers(u?.users || u || []); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const pros = users.filter(u => u.role === "pro");
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault(); if (!form.user_id || !form.target_value) return; setSaving(true);
    try {
      await setTarget({ ...form, user_id: Number(form.user_id), target_value: Number(form.target_value) });
      setOpen(false); load();
    } catch (err) { console.error("setTarget error:", err); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Targets</div>
        <Btn onClick={() => setOpen(true)}>+ Set Target</Btn>
      </div>

      {targets.length === 0 ? <Empty msg="No targets set yet" icon="target" /> : targets.map((t, i) => (
        <Card key={i} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{t.user_name}</div>
            <span style={{ fontSize: 11, color: C.muted }}>{t.period}</span>
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{t.metric_name || t.metric}</div>
          <Bar value={t.achieved ?? t.current ?? 0} max={t.target_value ?? t.target ?? 0} />
        </Card>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Set Target">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select label="PRO User" value={form.user_id} onChange={e => F("user_id", e.target.value)} required
            options={[{ value: "", label: "— Select PRO —" }, ...pros.map(u => ({ value: String(u.id), label: u.name || u.username }))]} />
          <Select label="Metric" value={form.metric} onChange={e => F("metric", e.target.value)} options={METRICS.map(m => ({ value: m, label: m }))} />
          <Input label="Target Value" value={form.target_value} onChange={e => F("target_value", e.target.value)} type="number" required placeholder="e.g. 20" />
          <Select label="Period" value={form.period} onChange={e => F("period", e.target.value)}
            options={[{ value: "monthly", label: "Monthly" }, { value: "weekly", label: "Weekly" }]} />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%" }}>{saving ? "Saving..." : "Set Target"}</Btn>
        </form>
      </Modal>
    </div>
  );
}
