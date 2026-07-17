import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import { getActivities, addActivity, getVenues } from "../../api/field.api.js";

const TYPES = ["Venue Visit","Demo","Meeting","Event","Door-to-Door","School Visit","College Visit","Corporate Visit","Other"];

export default function ProActivities() {
  const [items,   setItems]   = useState([]);
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ venue_id: "", type: "Venue Visit", notes: "", duration_min: "" });

  const load = () => {
    Promise.all([getActivities({}), getVenues()])
      .then(([a, v]) => { setItems(a?.activities || a || []); setVenues(v?.venues || v || []); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      await addActivity({ ...form, venue_id: form.venue_id ? Number(form.venue_id) : undefined, duration_min: form.duration_min ? Number(form.duration_min) : undefined });
      setOpen(false); setForm({ venue_id: "", type: "Venue Visit", notes: "", duration_min: "" }); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>📋 Activities</div>
        <Btn onClick={() => setOpen(true)}>+ Log Activity</Btn>
      </div>

      {items.length === 0 ? <Empty msg="No activities yet" icon="📋" /> : items.map((a, i) => (
        <Card key={i} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{a.type}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{new Date(a.created_at).toLocaleDateString()}</div>
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: a.notes ? 8 : 0 }}>{a.venue_name || "—"}{a.duration_min ? ` · ${a.duration_min} min` : ""}</div>
          {a.notes && <div style={{ fontSize: 13, color: C.text, background: C.bg, borderRadius: 8, padding: "8px 10px" }}>{a.notes}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {a.late_flag     && <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Late Entry</span>}
            {a.gps_flag      && <span style={{ background: C.dangerBg,  color: C.danger,  borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>GPS Flag</span>}
          </div>
        </Card>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Activity">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select label="Venue" value={form.venue_id} onChange={e => F("venue_id", e.target.value)}
            options={[{ value: "", label: "— Select venue —" }, ...venues.map(v => ({ value: String(v.id), label: v.name }))]} />
          <Select label="Activity Type" value={form.type} onChange={e => F("type", e.target.value)} required
            options={TYPES.map(t => ({ value: t, label: t }))} />
          <Input label="Duration (minutes)" value={form.duration_min} onChange={e => F("duration_min", e.target.value)} type="number" placeholder="e.g. 45" />
          <Input label="Notes" value={form.notes} onChange={e => F("notes", e.target.value)} placeholder="What did you do?" />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%" }}>{saving ? "Saving..." : "Save Activity"}</Btn>
        </form>
      </Modal>
    </div>
  );
}
