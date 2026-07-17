import { useState, useEffect, useRef } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Select, Spinner } from "../../components/ui.jsx";
import { getTodayStatus, checkInApi, checkOutApi, getVenues } from "../../api/field.api.js";
import { useLocationTracker } from "../../hooks/useLocationTracker.js";

function getGPS() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error("GPS not available"));
    navigator.geolocation.getCurrentPosition(
      p => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => rej(new Error("GPS denied: " + e.message)),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

async function takeSelfie() {
  return new Promise((res, rej) => {
    const video  = document.createElement("video");
    const canvas = document.createElement("canvas");
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        setTimeout(() => {
          canvas.width = 320; canvas.height = 240;
          canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
          stream.getTracks().forEach(t => t.stop());
          res(canvas.toDataURL("image/jpeg", 0.7));
        }, 1500);
      }).catch(rej);
  });
}

export default function CheckIn({ authUser }) {
  const [status,   setStatus]   = useState(null);
  const [venues,   setVenues]   = useState([]);
  const [venueId,  setVenueId]  = useState("");
  const [loading,  setLoading]  = useState(true);
  const [working,  setWorking]  = useState(false);
  const [step,     setStep]     = useState("idle"); // idle | gps | selfie | done | error
  const [msg,      setMsg]      = useState("");
  const [gps,      setGps]      = useState(null);
  const [selfie,   setSelfie]   = useState(null);
  const [elapsed,  setElapsed]  = useState(null);
  const tracker = useLocationTracker();
  const timer   = useRef(null);

  useEffect(() => {
    Promise.all([getTodayStatus(), getVenues()])
      .then(([s, v]) => {
        setStatus(s);
        setVenues(v?.venues || v || []);
        if (!s?.checked_in && v?.length > 0) setVenueId(String((v?.venues || v)[0]?.id || ""));
        if (s?.checked_in && s?.check_in_time) {
          const start = new Date(s.check_in_time).getTime();
          timer.current = setInterval(() => {
            const diff = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), sec = diff % 60;
            setElapsed(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`);
          }, 1000);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  async function handleCheckIn() {
    if (!venueId) return;
    setWorking(true); setMsg("");
    try {
      setStep("gps");
      const pos = await getGPS();
      setGps(pos); setStep("selfie"); setMsg("Getting selfie...");
      const photo = await takeSelfie();
      setSelfie(photo); setStep("done"); setMsg("Checking in...");
      await checkInApi({ venue_id: Number(venueId), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, selfie: photo });
      tracker.start();
      const s = await getTodayStatus();
      setStatus(s);
      const start = new Date(s.check_in_time).getTime();
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => {
        const diff = Math.floor((Date.now() - start) / 1000);
        const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), sec = diff % 60;
        setElapsed(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`);
      }, 1000);
      setMsg("✅ Checked in successfully!");
    } catch (e) { setStep("error"); setMsg("❌ " + (e.message || "Check-in failed")); }
    finally { setWorking(false); }
  }

  async function handleCheckOut() {
    setWorking(true); setMsg("Checking out...");
    try {
      await getGPS().then(pos => checkOutApi({ lat: pos.lat, lng: pos.lng }));
      tracker.stop();
      if (timer.current) clearInterval(timer.current);
      const s = await getTodayStatus();
      setStatus(s); setElapsed(null);
      setMsg("✅ Checked out successfully!");
    } catch (e) { setMsg("❌ " + (e.message || "Check-out failed")); }
    finally { setWorking(false); }
  }

  if (loading) return <Spinner />;

  const checkedIn = status?.checked_in;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>
        {checkedIn ? "📍 Currently Checked In" : "📍 Check In"}
      </div>

      {checkedIn ? (
        <Card style={{ padding: 24, textAlign: "center", background: C.primary }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{status.venue_name}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 8 }}>
            Since {new Date(status.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          {elapsed && <div style={{ color: "#fff", fontSize: 32, fontWeight: 700, fontFamily: "monospace", marginBottom: 20 }}>{elapsed}</div>}
          <Btn onClick={handleCheckOut} disabled={working} variant="danger" size="lg" style={{ width: "100%" }}>
            {working ? "Processing..." : "Check Out"}
          </Btn>
        </Card>
      ) : (
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Select label="Select Venue" value={venueId} onChange={e => setVenueId(e.target.value)} required
            options={venues.map(v => ({ value: String(v.id), label: v.name + (v.location ? ` — ${v.location}` : "") }))} />
          {step === "gps"    && <div style={{ color: C.info, fontSize: 14, textAlign: "center" }}>📡 Getting your location...</div>}
          {step === "selfie" && <div style={{ color: C.info, fontSize: 14, textAlign: "center" }}>📷 Taking selfie...</div>}
          {selfie            && <img src={selfie} alt="selfie" style={{ borderRadius: 10, width: "100%", maxHeight: 200, objectFit: "cover" }} />}
          {msg               && <div style={{ color: msg.startsWith("✅") ? C.success : msg.startsWith("❌") ? C.danger : C.info, fontSize: 14, textAlign: "center" }}>{msg}</div>}
          <Btn onClick={handleCheckIn} disabled={working || !venueId} size="lg" style={{ width: "100%" }}>
            {working ? "Processing..." : "🚀 Check In"}
          </Btn>
          <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>GPS + selfie required at check-in</div>
        </Card>
      )}

      {/* Today summary */}
      {status && (
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Today's Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Check-in",    value: status.check_in_time  ? new Date(status.check_in_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})  : "—" },
              { label: "Check-out",   value: status.check_out_time ? new Date(status.check_out_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—" },
              { label: "Venue",       value: status.venue_name || "—" },
              { label: "Trust Score", value: status.trust_score != null ? status.trust_score + "%" : "—" },
            ].map(r => (
              <div key={r.label} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.value}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
