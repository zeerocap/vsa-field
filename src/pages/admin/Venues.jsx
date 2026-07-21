import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getVenues, addVenue, updateVenue } from "../../api/field.api.js";

const VTYPES = ["school","college","coaching","corporate","mall","event","hospital","other"];
const VTYPE_LABELS = { school:"School", college:"College", coaching:"Coaching", corporate:"Corporate",
  mall:"Mall", event:"Event Venue", hospital:"Hospital", other:"Other" };
const REL_STATUS = ["new","warm","active","cold"];
const DISTRICTS  = ["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki",
  "Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"];

const REL_COLORS = {
  active: { color: C.success, bg: C.successBg },
  warm:   { color: "#D97706", bg: "#FEF3C7" },
  new:    { color: C.info,    bg: C.infoBg },
  cold:   { color: C.muted,   bg: C.bg },
};

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function AdminVenues() {
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [search,  setSearch]  = useState("");
  const [form,    setForm]    = useState({
    name: "", district: "", place: "", address: "",
    venueType: "school", contactName: "", contactPhone: "",
    relationshipStatus: "new", notes: "",
  });

  const load = () => {
    getVenues().then(r => setVenues(r?.venues || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew  = () => {
    setEditing(null);
    setForm({ name: "", district: "", place: "", address: "", venueType: "school",
      contactName: "", contactPhone: "", relationshipStatus: "new", notes: "" });
    setOpen(true);
  };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      name: v.name || "", district: v.district || "", place: v.place || "", address: v.address || "",
      venueType: v.venue_type || "school", contactName: v.contact_name || "",
      contactPhone: v.contact_phone || "", relationshipStatus: v.relationship_status || "new", notes: v.notes || "",
    });
    setOpen(true);
  };
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault(); if (!form.name || !form.district) return; setSaving(true);
    try {
      if (editing) {
        await updateVenue({
          venueId: editing.id,
          contactName: form.contactName, contactPhone: form.contactPhone,
          address: form.address, relationshipStatus: form.relationshipStatus, notes: form.notes,
        });
      } else {
        await addVenue({
          name: form.name, district: form.district, place: form.place, address: form.address,
          venueType: form.venueType, contactName: form.contactName, contactPhone: form.contactPhone,
          relationshipStatus: form.relationshipStatus, notes: form.notes,
        });
      }
      setOpen(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  const filtered = search
    ? venues.filter(v => v.name?.toLowerCase().includes(search.toLowerCase()) || v.district?.toLowerCase().includes(search.toLowerCase()))
    : venues;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 22, color: C.text }}>Venues</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{filtered.length} venue{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        <Btn onClick={openNew}>+ Add Venue</Btn>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search venues or district..."
        style={{ padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 8,
          fontSize: 13, background: C.card, color: C.text, outline: "none", width: "100%", boxSizing: "border-box" }}
      />

      {filtered.length === 0 ? <Empty msg="No venues yet" icon="building" /> : filtered.map((v, i) => {
        const rc = REL_COLORS[v.relationship_status] || REL_COLORS.new;
        return (
          <Card key={v.id || i} style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => openEdit(v)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 5 }}>{v.name}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ background: C.infoBg, color: C.info, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                    {VTYPE_LABELS[v.venue_type] || v.venue_type || "—"}
                  </span>
                  <span style={{ background: rc.bg, color: rc.color, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                    {v.relationship_status || "new"}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: C.muted }}>{v.district}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Last: {timeAgo(v.last_visited_at)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {v.contact_name && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.muted }}>
                  <Icon name="user" size={12} color={C.muted} />
                  {v.contact_name}
                </div>
              )}
              {v.contact_phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.muted }}>
                  <Icon name="phone" size={12} color={C.muted} />
                  {v.contact_phone}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.brand }}>{v.total_visits || 0}</span>
                <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>visits</span>
              </div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.success }}>{v.total_leads || 0}</span>
                <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>leads</span>
              </div>
            </div>
          </Card>
        );
      })}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Venue" : "Add Venue"}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!editing && (
            <>
              <Input label="Venue Name *" value={form.name} onChange={e => F("name", e.target.value)} required placeholder="School / College name" />
              <Select label="Type *" value={form.venueType} onChange={e => F("venueType", e.target.value)}
                options={VTYPES.map(t => ({ value: t, label: VTYPE_LABELS[t] }))} />
              <Select label="District *" value={form.district} onChange={e => F("district", e.target.value)} required
                options={[{ value: "", label: "— Select district —" }, ...DISTRICTS.map(d => ({ value: d, label: d }))]} />
              <Input label="Place / Area" value={form.place} onChange={e => F("place", e.target.value)} placeholder="Town or locality" />
            </>
          )}
          <Input label="Address" value={form.address} onChange={e => F("address", e.target.value)} placeholder="Full address" />
          <Input label="Contact Name" value={form.contactName} onChange={e => F("contactName", e.target.value)} placeholder="Principal / POC name" />
          <Input label="Contact Phone" value={form.contactPhone} onChange={e => F("contactPhone", e.target.value)} placeholder="Phone number" />
          <Select label="Relationship Status" value={form.relationshipStatus} onChange={e => F("relationshipStatus", e.target.value)}
            options={REL_STATUS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
          <Input label="Notes" value={form.notes} onChange={e => F("notes", e.target.value)} placeholder="Any details..." />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%" }}>
            {saving ? "Saving..." : editing ? "Update Venue" : "Add Venue"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
