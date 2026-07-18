import { useState, useEffect, useCallback } from "react";
import C from "../../constants/theme.js";
import { Spinner } from "../../components/ui.jsx";
import { getUsers } from "../../api/field.api.js";
import { getTerritory, setTerritory } from "../../api/field.api.js";

const KERALA_DISTRICTS = [
  "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam",
  "Idukki","Ernakulam","Thrissur","Palakkad","Malappuram",
  "Kozhikode","Wayanad","Kannur","Kasaragod",
];

export default function AdminTerritory() {
  const [pros,       setPros]       = useState([]);
  const [territories,setTerritories]= useState([]); // [{ pro_username, districts }]
  const [editing,    setEditing]    = useState({}); // { username: [districts] }
  const [saving,     setSaving]     = useState({}); // { username: bool }
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ur, tr] = await Promise.all([getUsers(), getTerritory()]);
      const proList  = (ur?.users || ur || []).filter(u => u.role === "pro");
      setPros(proList);
      setTerritories(tr?.territories || tr || []);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function getTerritoryFor(username) {
    if (editing[username] !== undefined) return editing[username];
    const t = territories.find(t => t.pro_username === username);
    return t?.districts || [];
  }

  function toggleDistrict(username, district) {
    const cur = getTerritoryFor(username);
    const next = cur.includes(district) ? cur.filter(d => d !== district) : [...cur, district];
    setEditing(e => ({ ...e, [username]: next }));
  }

  async function handleSave(username) {
    setSaving(s => ({ ...s, [username]: true }));
    try {
      await setTerritory({ proUsername: username, districts: getTerritoryFor(username) });
      // update local territories
      setTerritories(prev => {
        const idx = prev.findIndex(t => t.pro_username === username);
        const updated = { pro_username: username, districts: getTerritoryFor(username) };
        if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n; }
        return [...prev, updated];
      });
      setEditing(e => { const n = { ...e }; delete n[username]; return n; });
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSaving(s => ({ ...s, [username]: false }));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>Territory Assignment</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          Assign Kerala districts to each PRO. PROs see their territory in the Field Tracker app.
        </div>
      </div>

      {error && (
        <div style={{ background: C.dangerBg, border: `1px solid #FECACA`, borderRadius: 10, padding: "11px 16px", marginBottom: 14, fontSize: 13, color: C.danger }}>
          {error}
        </div>
      )}

      {pros.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "48px 24px", textAlign: "center", color: C.muted, fontSize: 13 }}>
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>No PRO users found</div>
          <div>Add PRO users in Settings to assign territories.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pros.map(pro => {
            const cur     = getTerritoryFor(pro.username);
            const isDirty = editing[pro.username] !== undefined;
            const isSaving= saving[pro.username];

            return (
              <div key={pro.username} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                {/* PRO header */}
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.brand}15`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: C.brand, flexShrink: 0 }}>
                      {(pro.display_name || pro.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{pro.display_name || pro.username}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{pro.username} · {pro.centre || "—"} · {cur.length} district{cur.length !== 1 ? "s" : ""} assigned</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {isDirty && (
                      <button onClick={() => setEditing(e => { const n = { ...e }; delete n[pro.username]; return n; })}
                        style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.muted, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                        Reset
                      </button>
                    )}
                    <button onClick={() => handleSave(pro.username)} disabled={!isDirty || isSaving}
                      style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: isDirty ? C.brand : C.border, color: isDirty ? "#fff" : C.muted, fontSize: 12, cursor: isDirty ? "pointer" : "default", fontWeight: 700, opacity: isSaving ? 0.7 : 1 }}>
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>

                {/* District badges */}
                <div style={{ padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {KERALA_DISTRICTS.map(d => {
                    const active = cur.includes(d);
                    return (
                      <button key={d} onClick={() => toggleDistrict(pro.username, d)}
                        style={{
                          padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
                          border: `1.5px solid ${active ? C.brand : C.border}`,
                          background: active ? C.brand : "#fff",
                          color: active ? "#fff" : C.muted,
                          cursor: "pointer", transition: "all .15s",
                        }}>
                        {d}
                      </button>
                    );
                  })}
                </div>

                {/* "Select all / Clear all" quick links */}
                <div style={{ padding: "0 16px 12px", display: "flex", gap: 12 }}>
                  <span onClick={() => setEditing(e => ({ ...e, [pro.username]: [...KERALA_DISTRICTS] }))}
                    style={{ fontSize: 11, color: C.brand, cursor: "pointer", fontWeight: 600 }}>Select all</span>
                  <span onClick={() => setEditing(e => ({ ...e, [pro.username]: [] }))}
                    style={{ fontSize: 11, color: C.muted, cursor: "pointer" }}>Clear all</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
