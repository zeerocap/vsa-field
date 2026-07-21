import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty, FormError } from "../../components/ui.jsx";
import { useToast } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getActivities, addActivity, getVenues } from "../../api/field.api.js";

const TYPES = [
  "School Visit","College Visit","Mall Activation","Event",
  "Door-to-Door","Corporate Visit","Venue Visit","Meeting","Other",
];

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const TYPE_COLORS = {
  "School Visit":    { color: C.brand,   bg: C.brandBg },
  "College Visit":   { color: C.info,    bg: C.infoBg },
  "Mall Activation": { color: "#7C3AED", bg: "#F5F3FF" },
  "Event":           { color: C.warning, bg: C.warningBg },
  "Door-to-Door":    { color: "#0891B2", bg: "#E0F2FE" },
  "Corporate Visit": { color: C.success, bg: C.successBg },
};

export default function ProActivities() {
  const toast = useToast();
  const [loadErr, setLoadErr] = useState(null);
  const [items,   setItems]   = useState([]);
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
  const [form,    setForm]    = useState({
    venue_id: "", activity_type: "School Visit", leads_captured: "",
    notes: "", duration_min: "", activity_date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    setLoading(true);
    Promise.all([getActivities({}), getVenues()])
      .then(([a, v]) => { setItems(a?.activities || []); setVenues(v?.venues || []); })
      .catch(e => setLoadErr(e.message || "Could not load. Check your connection."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => {
    setErr("");
    setForm({
      venue_id: "", activity_type: "School Visit", leads_captured: "",
      notes: "", duration_min: "", activity_date: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  async function handleSave(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      // The backend destructures venueName/venueId/activityDate/activityType/
      // description — sending snake_case form keys meant venueName was always
      // undefined and every submission was rejected with "venueName required".
      const venue = venues.find(v => String(v.id) === String(form.venue_id));
      const res = await addActivity({
        venueId:      form.venue_id ? Number(form.venue_id) : undefined,
        venueName:    venue?.name || form.venue_name || "Unnamed visit",
        activityDate: form.activity_date,
        activityType: form.activity_type,
        description:  form.notes || "",
        durationMin:  form.duration_min ? Number(form.duration_min) : undefined,
      });
      if (!res.ok) { setErr(res.error || "Failed to save"); return; }
      setOpen(false);
      toast("Activity logged!", "success");
      load();
    } catch (e) { setErr(e.message || "Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormError msg={loadErr} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20, color: C.text }}>Activities</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{items.length} logged total</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={load}>
            <Icon name="refresh-cw" size={13} color={C.muted} />
          </Btn>
          <Btn onClick={openNew} size="sm">+ Log Activity</Btn>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty msg="No activities yet" icon="clipboard" action={openNew} actionLabel="Log your first activity" />
      ) : items.map((a, i) => {
        const tc = TYPE_COLORS[a.activity_type] || { color: C.muted, bg: C.bg };
        return (
          <Card key={a.id || i} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 5 }}>
                  <span style={{ background: tc.bg, color: tc.color, borderRadius: 20,
                    padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                    {a.activity_type?.replace(/_/g, " ") || "Activity"}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {a.venue_name || "—"}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmtDate(a.activity_date)}</div>
              </div>
              <div style={{ textAlign: "center", background: C.bg, borderRadius: 10,
                padding: "8px 12px", minWidth: 52 }}>
                <div style={{ fontSize: 20, fontWeight: 900,
                  color: (a.leads_captured || 0) > 0 ? C.success : C.muted }}>
                  {a.leads_captured || 0}
                </div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 0.3 }}>LEADS</div>
              </div>
            </div>
            {(a.notes || a.description) && (
              <div style={{ fontSize: 12, color: C.muted, background: C.bg, borderRadius: 8,
                padding: "8px 10px", marginBottom: 8 }}>
                {(a.notes || a.description).slice(0, 120)}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {a.duration_min && (
                <span style={{ background: C.infoBg, color: C.info, borderRadius: 20,
                  padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>
                  {a.duration_min} min
                </span>
              )}
              {a.is_late_entry && (
                <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20,
                  padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>Late Entry</span>
              )}
              {(a.fake_gps_flag || a.gps_flag) && (
                <span style={{ background: C.dangerBg, color: C.danger, borderRadius: 20,
                  padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>GPS Flag</span>
              )}
            </div>
          </Card>
        );
      })}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Activity">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormError msg={err} />
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted,
              marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>Date</label>
            <input type="date" value={form.activity_date}
              onChange={e => F("activity_date", e.target.value)}
              max={new Date().toISOString().slice(0,10)}
              style={{ width: "100%", padding: "11px 13px", borderRadius: 9, fontFamily: "inherit",
                border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text,
                outline: "none", boxSizing: "border-box" }} />
          </div>
          <Select label="Activity Type" value={form.activity_type}
            onChange={e => F("activity_type", e.target.value)} required
            options={TYPES.map(t => ({ value: t, label: t }))} />
          <Select label="Venue" value={form.venue_id} onChange={e => F("venue_id", e.target.value)}
            options={[{ value: "", label: "— Select venue (optional) —" },
              ...venues.map(v => ({ value: String(v.id), label: v.name }))]} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Leads Captured" value={form.leads_captured}
              onChange={e => F("leads_captured", e.target.value)} type="number" min="0" placeholder="0" />
            <Input label="Duration (min)" value={form.duration_min}
              onChange={e => F("duration_min", e.target.value)} type="number" min="1" placeholder="e.g. 45" />
          </div>
          <Input label="Notes" value={form.notes} onChange={e => F("notes", e.target.value)}
            placeholder="What did you do? Any highlights?" />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%", marginTop: 4 }}>
            {saving ? "Saving…" : "Save Activity"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
