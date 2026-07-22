import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import C from "../../constants/theme.js";
import { displayName, getTerritoriesApi, setTerritoryApi } from "./_shared.jsx";

export default function TerritoryAdminTab({ authUser, proMap, isMobile }) {
  const [territories, setTerritories] = useState([]);
  const [editing, setEditing] = useState({}); // { pro_username: [districts] }
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTerritoriesApi(authUser.token).then((r) => {
      if (r.ok) setTerritories(r.territories || []);
      setLoading(false);
    });
  }, [authUser.token]);

  const territoryMap = {};
  territories.forEach((t) => {
    territoryMap[t.pro_username] = t.districts || [];
  });

  const toggleDistrict = (pro, dist) => {
    const cur = editing[pro] ?? (territoryMap[pro] || []);
    const next = cur.includes(dist) ? cur.filter((d) => d !== dist) : [...cur, dist];
    setEditing((e) => ({ ...e, [pro]: next }));
  };

  const handleSave = async (pro) => {
    setSaving((s) => ({ ...s, [pro]: true }));
    const districts = editing[pro] ?? (territoryMap[pro] || []);
    const res = await setTerritoryApi(authUser.token, { proUsername: pro, districts });
    setSaving((s) => ({ ...s, [pro]: false }));
    if (res.ok) {
      setTerritories((prev) => {
        const idx = prev.findIndex((t) => t.pro_username === pro);
        if (idx >= 0) {
          const n = [...prev];
          n[idx] = { ...n[idx], districts };
          return n;
        }
        return [...prev, { pro_username: pro, districts }];
      });
      setSaved((s) => ({ ...s, [pro]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [pro]: false })), 2000);
      setEditing((e) => {
        const n = { ...e };
        delete n[pro];
        return n;
      });
    }
  };

  const KERALA_DISTRICTS_LIST = [
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta",
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Ernakulam",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod",
  ];

  if (loading)
    return <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
        Assign Kerala districts to each PRO. PROs see their territory on the Field Tracker app.
      </div>

      {proMap.map((pro) => {
        const cur = editing[pro.username] ?? (territoryMap[pro.username] || []);
        const isDirty = editing[pro.username] !== undefined;
        const isSav = saving[pro.username];
        const wasSaved = saved[pro.username];

        return (
          <div
            key={pro.username}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                  {displayName(pro.username)}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {pro.centre} · {cur.length} district{cur.length !== 1 ? "s" : ""} assigned
                </div>
              </div>
              <button
                onClick={() => handleSave(pro.username)}
                disabled={isSav || (!isDirty && !wasSaved)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: wasSaved ? C.success : C.brand,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: isSav ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {isSav ? (
                  "Saving…"
                ) : wasSaved ? (
                  <>
                    <Check size={13} /> Saved
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {KERALA_DISTRICTS_LIST.map((d) => {
                const on = cur.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDistrict(pro.username, d)}
                    style={{
                      padding: isMobile ? "7px 14px" : "5px 12px",
                      borderRadius: 20,
                      border: `1.5px solid ${on ? C.brand : C.border}`,
                      background: on ? `${C.brand}12` : "transparent",
                      color: on ? C.brand : C.muted,
                      fontSize: isMobile ? 13 : 12,
                      fontWeight: on ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {proMap.length === 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "48px 24px",
            textAlign: "center",
            color: C.muted,
            fontSize: 13,
          }}
        >
          No PROs found. Territory assignment requires at least one PRO with logged activities.
        </div>
      )}
    </div>
  );
}
