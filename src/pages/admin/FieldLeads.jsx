import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Spinner, Empty, Select, Input } from "../../components/ui.jsx";
import { getFieldLeads, getUsers } from "../../api/field.api.js";

export default function AdminFieldLeads() {
  const [leads,   setLeads]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [filterU, setFilterU] = useState("");
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFieldLeads({}), getUsers()])
      .then(([l, u]) => { setLeads(l?.leads || l || []); setUsers(u?.users || u || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pros = users.filter(u => u.role === "pro");
  const filtered = leads.filter(l => {
    if (filterU && String(l.submitted_by) !== filterU) return false;
    if (search && !`${l.name} ${l.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Field Leads</div>

      <div style={{ display: "flex", gap: 8 }}>
        <Input placeholder="Search name / phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <Select value={filterU} onChange={e => setFilterU(e.target.value)} style={{ width: 150 }}
          options={[{ value: "", label: "All PROs" }, ...pros.map(u => ({ value: String(u.id), label: u.name || u.username }))]} />
      </div>

      <div style={{ fontSize: 12, color: C.muted }}>{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</div>

      {filtered.length === 0 ? <Empty msg="No leads found" icon="users" /> : filtered.map((l, i) => (
        <Card key={i} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{l.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{new Date(l.created_at).toLocaleDateString()}</div>
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>{l.phone}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ background: C.infoBg, color: C.info, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{l.course_interest || l.course}</span>
            {l.source     && <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{l.source}</span>}
            {l.venue_name && <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{l.venue_name}</span>}
            {l.user_name  && <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{l.user_name}</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}
