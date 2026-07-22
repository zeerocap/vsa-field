import { useState } from "react";
import { X, MapPin, AlertTriangle, Map, Pin } from "lucide-react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import C from "../../constants/theme.js";
import { GMAP_KEY, setVenueLocationApi } from "./_shared.jsx";

export default function PinLocationModal({ authUser, venue, onClose, onPinned }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GMAP_KEY, id: "vsa-gmap" });
  const [pinLatLng, setPinLatLng] = useState(venue.lat ? { lat: venue.lat, lng: venue.lng } : null);
  const [geoRadius, setGeoRadius] = useState(venue.geo_radius || 300);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const KERALA_CENTER = { lat: 10.25, lng: 76.5 };

  const handleMapClick = (e) => {
    setPinLatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setErr(null);
  };

  const handleSave = async () => {
    if (!pinLatLng) {
      setErr("Click on the map to drop a pin first.");
      return;
    }
    setSaving(true);
    const res = await setVenueLocationApi(authUser.token, {
      venueId: venue.id,
      lat: pinLatLng.lat,
      lng: pinLatLng.lng,
      geoRadius,
    });
    setSaving(false);
    if (res.ok) onPinned(res.venue);
    else setErr(res.error || "Failed to save location");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: C.text,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Pin size={16} color={C.brand} /> Pin Venue Location
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {venue.name} · {venue.district}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: C.bg,
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} color={C.muted} />
          </button>
        </div>

        {/* Map */}
        <div style={{ flex: 1, minHeight: 320, position: "relative" }}>
          {!isLoaded ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 320,
                color: C.muted,
                fontSize: 13,
              }}
            >
              Loading map…
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%", minHeight: 320 }}
              center={pinLatLng || KERALA_CENTER}
              zoom={pinLatLng ? 15 : 8}
              onClick={handleMapClick}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                fullscreenControl: false,
                mapTypeControl: false,
                clickableIcons: false,
              }}
            >
              {pinLatLng && (
                <OverlayView position={pinLatLng} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div
                    style={{
                      transform: "translate(-50%,-100%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <div
                      style={{
                        background: C.brand,
                        color: "#fff",
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      }}
                    >
                      {venue.name}
                    </div>
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: `8px solid ${C.brand}`,
                      }}
                    />
                    {/* Geofence circle indicator */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%,-50%)`,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: `2px solid ${C.brand}`,
                        opacity: 0.35,
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </OverlayView>
              )}
            </GoogleMap>
          )}
          {!pinLatLng && isLoaded && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.65)",
                color: "#fff",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              Click the map to drop a pin
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {pinLatLng && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: C.muted,
              }}
            >
              <MapPin size={12} color={C.brand} />
              <span style={{ fontFamily: "'SF Mono',monospace" }}>
                {pinLatLng.lat.toFixed(5)}, {pinLatLng.lng.toFixed(5)}
              </span>
              <button
                onClick={() => setPinLatLng(null)}
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: C.muted,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "inherit",
                }}
              >
                Clear pin
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>
              Geofence radius (m):
            </label>
            <input
              type="number"
              value={geoRadius}
              onChange={(e) => setGeoRadius(Number(e.target.value))}
              min={50}
              max={2000}
              style={{
                width: 80,
                padding: "6px 10px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <span style={{ fontSize: 11, color: C.muted }}>
              PROs must check in within this distance
            </span>
          </div>

          {err && (
            <div
              style={{
                fontSize: 12,
                color: "#B91C1C",
                background: "#FEF2F2",
                padding: "8px 12px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertTriangle size={12} color="#B91C1C" />
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !pinLatLng}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: "none",
                background: pinLatLng ? C.brand : C.border,
                color: "#fff",
                fontSize: 13,
                fontWeight: 800,
                cursor: pinLatLng ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Pin size={13} /> Save Location
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
