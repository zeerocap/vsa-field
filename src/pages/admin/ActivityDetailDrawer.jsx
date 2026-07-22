import { X, Activity, Check } from "lucide-react";
import C from "../../constants/theme.js";

export default function ActivityDetailDrawer({ activity: act, onClose, isMobile }) {
  if (!act) return null;
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "—";
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999 }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: isMobile ? "100vw" : 440,
          background: "#fff",
          zIndex: 1000,
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          overflowY: "auto",
          padding: "20px 20px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Activity Details</div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} color={C.muted} />
          </button>
        </div>
        {[
          ["PRO", act.pro_username || "—"],
          ["Date", fmt(act.activity_date)],
          ["Venue", act.venue_name || "—"],
          ["District", act.district || "—"],
          ["Type", (act.activity_type || "").replace(/_/g, " ") || "—"],
          ["Leads", act.leads_captured || 0],
          // Manually-logged activities store their text in `description`, not
          // `notes` — the list rows already read notes||description, but this
          // drawer only read `notes`, so it showed "—" on activities that had a
          // note. Match the list-view fallback.
          ["Notes", act.notes || act.description || "—"],
        ].map(([l, v]) => (
          <div
            key={l}
            style={{
              display: "flex",
              borderBottom: `1px solid ${C.border}`,
              padding: "10px 0",
              gap: 12,
            }}
          >
            <div style={{ width: 90, fontSize: 12, color: C.muted, flexShrink: 0 }}>{l}</div>
            <div
              style={{
                fontSize: 13,
                color: C.text,
                fontWeight: 500,
                flex: 1,
                wordBreak: "break-word",
              }}
            >
              {String(v)}
            </div>
          </div>
        ))}
        {act.selfie_photo && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Check-in Selfie</div>
            <img
              src={act.selfie_photo}
              alt="selfie"
              style={{ width: "100%", borderRadius: 10, display: "block" }}
            />
          </div>
        )}
      </div>
    </>
  );
}
