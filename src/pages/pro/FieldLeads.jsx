import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty, FormError } from "../../components/ui.jsx";
import { useToast } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getFieldLeads, addActivity, getVenues } from "../../api/field.api.js";

const COURSES = ["Aviation","Cabin Crew","Ground Staff","Air Ticketing","Airport Management","Pilot Training","Other"];
const SOURCES  = ["Walk-in","Event","Referral","Door-to-Door","School Visit","College Visit","Social Media","Other"];

const STATUS_COLOR = {
  new:         { color: C.info,    bg: C.infoBg },
  contacted:   { color: C.warning, bg: C.warningBg },
  interested:  { color: C.success, bg: C.successBg },
  converted:   { color: C.brand,   bg: C.brandBg },
};

export default function ProFieldLeads() {
  const toast = useToast();
  const [loadErr, setLoadErr] = useState(null);
  const [leads,   setLeads]   = useState([]);
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
  const [search,  setSearch]  = useState("");
  const [form,    setForm]    = useState({
    name: "", phone: "", course: "Aviation",
    source: "Walk-in", venue_id: "", notes: "",
  });

  const load = () => {
    setLoading(true);
    Promise.all([getFieldLeads({}), getVenues()])
      .then(([l, v]) => { setLeads(l?.leads || []); setVenues(v?.venues || []); })
      .catch(e => setLoadErr(e.message || "Could not load. Check your connection."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => {
    setErr("");
    setForm({ name: "", phone: "", course: "Aviation", source: "Walk-in", venue_id: "", notes: "" });
    setOpen(true);
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.phone) { setErr("Name and phone are required"); return; }
    setErr(""); setSaving(true);
    try {
      // addFieldLeads requires an activityId, and field_leads.activity_id is NOT
      // NULL — a standalone lead has nowhere to attach. Capturing a lead IS a field
      // interaction, so record it as an activity that carries the lead; the backend
      // writes both rows together. The old call also passed an ARRAY, which spread
      // into the request body as key "0" and left activityId undefined.
      const venue = venues.find(v => String(v.id) === String(form.venue_id));
      const res = await addActivity({
        venueId:      form.venue_id ? Number(form.venue_id) : undefined,
        venueName:    venue?.name || form.source || "Walk-in",
        activityDate: new Date().toISOString().slice(0, 10),
        activityType: "lead_capture",
        description:  form.notes || "",
        leads: [{
          fullName:         form.name,
          phoneNumber:      form.phone,
          courseInterested: form.course,
          notes:            form.notes || "",
        }],
      });
      if (!res.ok) { setErr(res.error || "Failed to save lead"); return; }
      setOpen(false);
      toast("Lead added!", "success");
      load();
    } catch (e) { setErr(e.message || "Failed to save lead"); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  const filtered = leads.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormError msg={loadErr} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20, color: C.text }}>Field Leads</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{leads.length} total leads</div>
        </div>
        <Btn onClick={openNew} size="sm">+ Add Lead</Btn>
      </div>

      {leads.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          style={{ width: "100%", padding: "10px 13px", border: `1.5px solid ${C.border}`,
            borderRadius: 9, fontSize: 13, color: C.text, outline: "none",
            background: "#fff", boxSizing: "border-box", fontFamily: "inherit" }}
        />
      )}

      {filtered.length === 0 ? (
        <Empty msg={search ? "No leads match your search" : "No field leads yet"}
          icon="users" action={!search ? openNew : undefined} actionLabel="Add your first lead" />
      ) : filtered.map((l, i) => {
        const sc = STATUS_COLOR[l.status] || STATUS_COLOR.new;
        return (
          <Card key={i} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{l.name}</div>
                <a href={`tel:${l.phone}`}
                  style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3,
                    color: C.brand, fontSize: 13, fontWeight: 600 }}>
                  <Icon name="phone" size={12} color={C.brand} />
                  {l.phone}
                </a>
              </div>
              <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
                {new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ background: C.infoBg, color: C.info, borderRadius: 20,
                padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                {l.course_interest || l.course}
              </span>
              <span style={{ background: C.bg, color: C.muted, borderRadius: 20,
                padding: "2px 10px", fontSize: 11, fontWeight: 500 }}>
                {l.source}
              </span>
              {l.status && (
                <span style={{ background: sc.bg, color: sc.color, borderRadius: 20,
                  padding: "2px 10px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
                  {l.status}
                </span>
              )}
              {l.venue_name && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, background: C.bg,
                  color: C.muted, borderRadius: 20, padding: "2px 9px", fontSize: 11 }}>
                  <Icon name="mappin" size={10} color={C.muted} />
                  {l.venue_name}
                </span>
              )}
            </div>
          </Card>
        );
      })}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Field Lead">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormError msg={err} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Full Name" value={form.name} onChange={e => F("name", e.target.value)}
              required placeholder="e.g. Arjun Kumar" />
            <Input label="Phone" value={form.phone} onChange={e => F("phone", e.target.value)}
              required type="tel" placeholder="10-digit number" />
          </div>
          <Select label="Course Interest" value={form.course} onChange={e => F("course", e.target.value)}
            options={COURSES.map(c => ({ value: c, label: c }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Source" value={form.source} onChange={e => F("source", e.target.value)}
              options={SOURCES.map(s => ({ value: s, label: s }))} />
            <Select label="Venue" value={form.venue_id} onChange={e => F("venue_id", e.target.value)}
              options={[{ value: "", label: "— Venue —" },
                ...venues.map(v => ({ value: String(v.id), label: v.name }))]} />
          </div>
          <Input label="Notes" value={form.notes} onChange={e => F("notes", e.target.value)}
            placeholder="Anything notable about this lead?" />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%", marginTop: 4 }}>
            {saving ? "Saving…" : "Add Lead"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
