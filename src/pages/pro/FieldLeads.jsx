import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getFieldLeads, addFieldLead, getVenues } from "../../api/field.api.js";

const COURSES = ["Aviation","Cabin Crew","Ground Staff","Air Ticketing","Airport Management","Other"];
const SOURCES  = ["Walk-in","Event","Referral","Door-to-Door","School Visit","College Visit","Other"];

export default function ProFieldLeads() {
  const [leads,   setLeads]   = useState([]);
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ name: "", phone: "", course: "Aviation", source: "Walk-in", venue_id: "", notes: "" });

  const load = () => {
    Promise.all([getFieldLeads({}), getVenues()])
      .then(([l, v]) => { setLeads(l?.leads || l || []); setVenues(v?.venues || v || []); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault(); if (!form.name || !form.phone) return; setSaving(true);
    try {
      await addFieldLead([{ ...form, venue_id: form.venue_id ? Number(form.venue_id) : undefined }]);
      setOpen(false); setForm({ name: "", phone: "", course: "Aviation", source: "Walk-in", venue_id: "", notes: "" }); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Field Leads</div>
        <Btn onClick={() => setOpen(true)}>+ Add Lead</Btn>
      </div>

      {leads.length === 0 ? <Empty msg="No field leads yet" icon="users" /> : leads.map((l, i) => (
        <Card key={i} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{l.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{new Date(l.created_at).toLocaleDateString()}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 13, color: C.muted }}>
            <Icon name="phone" size={12} color={C.muted} />
            {l.phone}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: C.infoBg, color: C.info, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
              {l.course_interest || l.course}
            </span>
            <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>
              {l.source}
            </span>
            {l.venue_name && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, background: C.bg, color: C.muted,
                borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>
                <Icon name="mappin" size={10} color={C.muted} />
                {l.venue_name}
              </span>
            )}
          </div>
        </Card>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Field Lead">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Name" value={form.name} onChange={e => F("name", e.target.value)} required placeholder="Full name" />
          <Input label="Phone" value={form.phone} onChange={e => F("phone", e.target.value)} required type="tel" placeholder="Mobile number" />
          <Select label="Course Interest" value={form.course} onChange={e => F("course", e.target.value)}
            options={COURSES.map(c => ({ value: c, label: c }))} />
          <Select label="Source" value={form.source} onChange={e => F("source", e.target.value)}
            options={SOURCES.map(s => ({ value: s, label: s }))} />
          <Select label="Venue" value={form.venue_id} onChange={e => F("venue_id", e.target.value)}
            options={[{ value: "", label: "— Select venue —" }, ...venues.map(v => ({ value: String(v.id), label: v.name }))]} />
          <Input label="Notes" value={form.notes} onChange={e => F("notes", e.target.value)} placeholder="Any additional info" />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%" }}>
            {saving ? "Saving..." : "Add Lead"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
