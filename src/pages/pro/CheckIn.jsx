import { useState, useEffect, useRef } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Select, Spinner } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
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
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        video.srcObject = stream; video.play();
        setTimeout(() => {
          canvas.width = 320; canvas.height = 240;
          canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
          stream.getTracks().forEach(t => t.stop());
          res(canvas.toDataURL("image/jpeg", 0.7));
        }, 1500);
      }).catch(rej);
  });
}

function StepMsg({ step, msg }) {
  const icon = step === "done" ? "check-circle"
             : step === "error" ? "x-circle"
             : step === "gps" ? "mappin"
             : step === "selfie" ? "camera"
             : "clock";
  const color = step === "done" ? C.success
              : step === "error" ? C.danger
              : C.brand;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
      background: color + "12", borderRadius: 8, fontSize: 13, fontWeight: 500, color }}>
      <Icon name={icon} size={16} color={color} />
      {msg}
    </div>
  );
}

export default function CheckIn() {
  const [status,  setStatus]  = useState(null);
  const [venues,  setVenues]  = useState([]);
  const [venueId, setVenueId] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [step,    setStep]    = useState("idle");
  const [msg,     setMsg]     = useState("");
  const [selfie,  setSelfie]  = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const tracker = useLocationTracker();
  const timer   = useRef(null);

  useEffect(() => {
    Promise.all([getTodayStatus(), getVenues()])
      .then(([s, v]) => {
        setStatus(s);
        const vlist = v?.venues || [];
        setVenues(vlist);
        if (!s?.checked_in && vlist.length > 0) setVenueId(String(vlist[0]?.id || ""));
        if (s?.checked_in && s?.check_in_time) startTimer(new Date(s.check_in_time).getTime());
      })
      .catch(() => {}).finally(() => setLoading(false));
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  function startTimer(startMs) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      const diff = Math.floor((Date.now() - startMs) / 1000);
      const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
      setElapsed(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
  }

  async function handleCheckIn() {
    if (!venueId) return;
    setWorking(true); setMsg(""); setSelfie(null);
    try {
      setStep("gps");    setMsg("Getting your location...");
      const pos = await getGPS();
      setStep("selfie"); setMsg("Capturing selfie...");
      const photo = await takeSelfie();
      setSelfie(photo);  setMsg("Checking in...");
      await checkInApi({ venue_id: Number(venueId), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, selfie: photo });
      tracker.start();
      const s = await getTodayStatus();
      setStatus(s); setStep("done"); setMsg("Checked in successfully!");
      startTimer(new Date(s.check_in_time).getTime());
    } catch (e) { setStep("error"); setMsg(e.message || "Check-in failed"); }
    finally { setWorking(false); }
  }

  async function handleCheckOut() {
    setWorking(true); setMsg("Checking out...");
    try {
      const pos = await getGPS().catch(() => ({ lat: null, lng: null }));
      await checkOutApi({ lat: pos.lat, lng: pos.lng });
      tracker.stop();
      if (timer.current) clearInterval(timer.current);
      const s = await getTodayStatus();
      setStatus(s); setElapsed(null); setStep("done"); setMsg("Checked out successfully!");
    } catch (e) { setStep("error"); setMsg(e.message || "Check-out failed"); }
    finally { setWorking(false); }
  }

  if (loading) return <Spinner />;

  const checkedIn = status?.checked_in;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 20, color: C.text }}>
        <Icon name="mappin" size={22} color={C.brand} />
        Check-In
      </div>

      {checkedIn ? (
        <Card style={{ padding: 28, textAlign: "center", background: C.brand, border: "none" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Icon name="check-circle" size={52} color="rgba(255,255,255,0.9)" />
          </div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 19, marginBottom: 4 }}>{status.venue_name}</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginBottom: 16 }}>
            Since {new Date(status.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          {elapsed && (
            <div style={{ color: "#fff", fontSize: 36, fontWeight: 800, fontFamily: "monospace",
              marginBottom: 24, letterSpacing: 2 }}>{elapsed}</div>
          )}
          <Btn onClick={handleCheckOut} disabled={working} variant="danger" size="lg" style={{ width: "100%" }}>
            {working ? "Processing…" : "Check Out"}
          </Btn>
          {msg && step !== "idle" && (
            <div style={{ marginTop: 12 }}>
              <StepMsg step={step} msg={msg} />
            </div>
          )}
        </Card>
      ) : (
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Select label="Select Venue" value={venueId} onChange={e => setVenueId(e.target.value)} required
            options={venues.length > 0
              ? venues.map(v => ({ value: String(v.id), label: v.name + (v.venue_type ? ` — ${v.venue_type}` : "") }))
              : [{ value: "", label: "No venues available" }]} />

          {["gps","selfie","done","error"].includes(step) && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {["gps","selfie","done"].map(s => (
                <div key={s} style={{ width: 8, height: 8, borderRadius: "50%",
                  background: step === "done" ? C.success : step === s ? C.brand : C.border }} />
              ))}
            </div>
          )}

          {selfie && (
            <img src={selfie} alt="selfie" style={{ borderRadius: 10, width: "100%", maxHeight: 180, objectFit: "cover" }} />
          )}

          {msg && step !== "idle" && <StepMsg step={step} msg={msg} />}

          <Btn onClick={handleCheckIn} disabled={working || !venueId} size="lg" style={{ width: "100%" }}>
            {working ? "Processing…" : "Check In"}
          </Btn>
          <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
            GPS + selfie required · Auto-checkout at 4 hours
          </div>
        </Card>
      )}

      {/* Today's summary */}
      {status && (
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>Today's Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Check-in",    value: status.check_in_time  ? new Date(status.check_in_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})  : "—" },
              { label: "Check-out",   value: status.check_out_time ? new Date(status.check_out_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—" },
              { label: "Venue",       value: status.venue_name  || "—" },
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
