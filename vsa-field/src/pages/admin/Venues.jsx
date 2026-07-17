import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import { getVenues, addVenue, updateVenue } from "../../api/field.api.js";

const VTYPES = ["School","College","Corporate","Mall","Event Venue","Coaching Centre","Hospital","Other"];

export default function AdminVenues() {
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: "", address: "", type: "School", contact_name: "", contact_phone: "", notes: "" });

  const load = () => {
    getVenues().then(r => setVenues(r?.venues || r || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew  = () => { setEditing(null); setForm({ name: "", address: "", type: "School", contact_name: "", contact_phone: "", notes: "" }); setOpen(true); };
  const openEdit = (v) => { setEditing(v); setForm({ name: v.name, address: v.address || "", type: v.type || "School", contact_name: v.contact_name || "", contact_phone: v.contact_phone || "", notes: v.notes || "" }); setOpen(true); };
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault(); if (!form.name) return; setSaving(true);
    try {
      if (editing) await updateVenue({ id: editing.id, ...form });
      else         await addVenue(form);
      setOpen(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>🏢 Venues</div>
        <Btn onClick={openNew}>+ Add Venue</Btn>
      </div>

      {venues.length === 0 ? <Empty msg="No venues yet" icon="🏢" /> : venues.map((v, i) => (
        <Card key={i} style={{ padding: "14px 16px" }} onClick={() => openEdit(v)}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{v.name}</div>
            <span style={{ background: C.infoBg, color: C.info, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{v.type}</span>
          </div>
          {v.address       && <div style={{ fontSize: 12, color: C.muted }}>📍 {v.address}</div>}
          {v.contact_name  && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>👤 {v.contact_name}{v.contact_phone ? ` · ${v.contact_phone}` : ""}</div>}
        </Card>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Venue" : "Add Venue"}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Venue Name" value={form.name} onChange={e => F("name", e.target.value)} required placeholder="School / College name" />
          <Select label="Type" value={form.type} onChange={e => F("type", e.target.value)} options={VTYPES.map(t => ({ value: t, label: t }))} />
          <Input label="Address" value={form.address} onChange={e => F("address", e.target.value)} placeholder="Full address" />
          <Input label="Contact Name" value={form.contact_name} onChange={e => F("contact_name", e.target.value)} placeholder="Principal / POC name" />
          <Input label="Contact Phone" value={form.contact_phone} onChange={e => F("contact_phone", e.target.value)} placeholder="Phone number" />
          <Input label="Notes" value={form.notes} onChange={e => F("notes", e.target.value)} placeholder="Any notes" />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%" }}>{saving ? "Saving..." : editing ? "Update Venue" : "Add Venue"}</Btn>
        </form>
      </Modal>
    </div>
  );
}
