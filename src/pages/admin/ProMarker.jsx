import { OverlayView } from "@react-google-maps/api";
import C from "../../constants/theme.js";

export default function ProMarker({ session, selected, onClick, elapsedLabel }) {
  const initial = (session.pro_username || "?")[0].toUpperCase();
  return (
    <OverlayView
      position={{ lat: session.lat, lng: session.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        onClick={onClick}
        style={{
          position: "relative",
          width: 44,
          height: 44,
          cursor: "pointer",
          transform: "translate(-22px,-44px)",
        }}
      >
        {session.selfie_photo ? (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `3px solid ${selected ? "#fff" : C.success}`,
              overflow: "hidden",
              boxShadow: selected
                ? "0 0 0 3px #16A34A, 0 4px 14px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(0,0,0,0.25)",
              background: "#fff",
            }}
          >
            <img
              src={session.selfie_photo}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="selfie"
            />
          </div>
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `3px solid ${selected ? "#fff" : C.brand}`,
              background: C.brand,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: selected
                ? "0 0 0 3px #7e1749, 0 4px 14px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(0,0,0,0.25)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 18,
              fontFamily: "sans-serif",
            }}
          >
            {initial}
          </div>
        )}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: C.success,
            border: "2px solid #fff",
            position: "absolute",
            bottom: 1,
            right: 1,
            animation: "_lpulse 2s ease-in-out infinite",
          }}
        />
      </div>
    </OverlayView>
  );
}
