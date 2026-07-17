import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import { getVenues, addVenue, updateVenue } from "../../api/field.api.js";

const VTYPES = [
  { value: "school",    label: "School" },
  { value: "college",   label: "College" },
  { value: "coaching",  label: "Coaching Centre" },
  { value: "corporate", label: "Corporate" },
  { value: "hospital",  label: "Hospital" },
  { value: "mall",      label: "Mall / Retail" },
  { value: "other",     label: "Other" },
];

const REL_TYPES = [
  { value: "new",    label: "New" },
  { value: "warm",   label: "Warm" },
  { value: "active", label: "Active" },
  { value: "cold",   label: "Cold" },
];

const KERALA_DISTRICTS = [
  "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam",
  "Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode",
  "Wayanad","Kannur","Kasaragod",
];

const typeColor = (t) => {
  const map = {
    school:    C.brand,
    college:   C.info,
    coaching:  C.success,
    corporate: C.warning,
    other:     C.muted,
  };
  return map[t] || C.muted;
};

export default function AdminVenues() {
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [err,     setErr]     = useState("");
  const [form,    setForm]    = useState({
    name: "", venueType: "school", district: "", place: "",
    address: "", contactName: "", contactPhone: "",
    relationshipStatus: "new", notes: "",
  });

  const load = () => {
    getVenues().then(r => setVenues(r?.venues || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setErr("");
    setForm({ name: "", venueType: "school", district: "", place: "", address: "", contactName: "", contactPhone: "", relationshipStatus: "new", notes: "" });
    setOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setErr("");
    setForm({
      name:               v.name || "",
      venueType:          v.venue_type || "school",
      district:           v.district || "",
      place:              v.place || "",
      address:            v.address || "",
      contactName:        v.contact_name || "",
      contactPhone:       v.contact_phone || "",
      relationshipStatus: v.relationship_status || "new",
      notes:              v.notes || "",
    });
    setOpen(true);
  };

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name) { setErr("Venue name is required"); return; }
    if (!form.district) { setErr("District is required"); return; }
    setSaving(true); setErr("");
    try {
      if (editing) {
        // updateVenue expects: venueId, contactName, contactPhone, address, relationshipStatus, notes
        await updateVenue({
          venueId:            editing.id,
          name:               form.name,
          contactName:        form.contactName,
          contactPhone:       form.contactPhone,
          address:            form.address,
          relationshipStatus: form.relationshipStatus,
          notes:              form.notes,
        });
      } else {
        // addVenue expects: name, venueType, district, place, address, contactName, contactPhone, relationshipStatus
        await addVenue({
          name:               form.name,
          venueType:          form.venueType,
          district:           form.district,
          place:              form.place,
          address:            form.address,
          contactName:        form.contactName,
          contactPhone:       form.contactPhone,
          relationshipStatus: form.relationshipStatus,
        });
      }
      setOpen(false); load();
    } catch (er) { setErr(er.message || "Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>🏢 Venues</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{venues.length} total venues</div>
        </div>
        <Btn onClick={openNew}>+ Add Venue</Btn>
      </div>

      {venues.length === 0 ? <Empty msg="No venues yet" icon="🏢" /> : venues.map((v, i) => (
        <Card key={v.id || i} style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => openEdit(v)}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{v.name}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ background: typeColor(v.venue_type) + "18", color: typeColor(v.venue_type), borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                {v.venue_type || "other"}
              </span>
              <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 8px", fontSize: 11, textTransform: "capitalize" }}>
                {v.relationship_status || "new"}
              </span>
            </div>
          </div>
          {v.district     && <div style={{ fontSize: 12, color: C.muted }}>📍 {v.district}{v.place ? ` — ${v.place}` : ""}</div>}
          {v.contact_name && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>👤 {v.contact_name}{v.contact_phone ? ` · ${v.contact_phone}` : ""}</div>}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.brand }}>{v.total_visits || 0} visits</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>{v.total_leads || 0} leads</span>
          </div>
        </Card>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Venue" : "Add Venue"}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {err && <div style={{ background: C.dangerBg, color: C.danger, borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>{err}</div>}

          <Input label="Venue Name *" value={form.name} onChange={e => F("name", e.target.value)} required placeholder="School / College name" />

          {!editing && (
            <>
              <Select label="Type" value={form.venueType} onChange={e => F("venueType", e.target.value)} options={VTYPES} />
              <Select label="District *" value={form.district} onChange={e => F("district", e.target.value)}
                options={[{ value: "", label: "— Select District —" }, ...KERALA_DISTRICTS.map(d => ({ value: d, label: d }))]} />
              <Input label="Place / Locality" value={form.place} onChange={e => F("place", e.target.value)} placeholder="e.g. Kakkanad, Thrissur Road" />
            </>
          )}

          <Input label="Address" value={form.address} onChange={e => F("address", e.target.value)} placeholder="Full address (for navigation)" />
          <Input label="Contact Name" value={form.contactName} onChange={e => F("contactName", e.target.value)} placeholder="Principal / POC name" />
          <Input label="Contact Phone" value={form.contactPhone} onChange={e => F("contactPhone", e.target.value)} placeholder="Phone number" />

          <Select label="Relationship Status" value={form.relationshipStatus} onChange={e => F("relationshipStatus", e.target.value)} options={REL_TYPES} />

          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%" }}>
            {saving ? "Saving…" : editing ? "Update Venue" : "Add Venue"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
