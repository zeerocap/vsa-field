import { useState, useEffect, useRef } from "react";
import { X, Camera, CheckCircle } from "lucide-react";
import C from "../../constants/theme.js";
import { enrollFaceApi as _enrollFaceApi } from "./_shared.jsx";

export default function EnrollFaceModal({ authUser, target, onClose, onEnrolled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("camera");
  const [photo, setPhoto] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => {
        setPhase("error");
        setErr("Camera not available.");
      });
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function capture() {
    const v = videoRef.current,
      c = canvasRef.current;
    c.width = 320;
    c.height = 240;
    c.getContext("2d").drawImage(v, 0, 0, 320, 240);
    setPhoto(c.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase("preview");
  }

  async function submit() {
    setPhase("submitting");
    try {
      const r = await _enrollFaceApi(null, { username: target.username, photoBase64: photo });
      if (r.ok !== false) {
        setPhase("done");
      } else {
        setPhase("error");
        setErr(r.error || "Enrollment failed");
      }
    } catch (e) {
      setPhase("error");
      setErr(e.message || "Failed");
    }
  }

  function retake() {
    setPhoto(null);
    setPhase("camera");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      });
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
          zIndex: 80,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          background: "#fff",
          borderRadius: 16,
          zIndex: 90,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          width: "min(95vw,380px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
              Enroll Face — {target.display_name || target.username}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Look straight at camera and capture
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <X size={18} color={C.muted} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {phase === "camera" && (
            <>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  background: "#111",
                  borderRadius: 10,
                  overflow: "hidden",
                  marginBottom: 14,
                  position: "relative",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "56%",
                      aspectRatio: "3/4",
                      border: "2px dashed rgba(255,255,255,0.4)",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              </div>
              <button
                onClick={capture}
                style={{
                  width: "100%",
                  padding: 13,
                  borderRadius: 10,
                  border: "none",
                  background: C.brand,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Camera size={16} /> Capture Photo
              </button>
            </>
          )}
          {phase === "preview" && (
            <>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  background: "#111",
                  borderRadius: 10,
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <img
                  src={photo}
                  alt="preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    display: "block",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={retake}
                  style={{
                    flex: 1,
                    padding: 11,
                    borderRadius: 9,
                    border: `1px solid ${C.border}`,
                    background: "#fff",
                    color: C.muted,
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Retake
                </button>
                <button
                  onClick={submit}
                  style={{
                    flex: 1,
                    padding: 11,
                    borderRadius: 9,
                    border: "none",
                    background: C.brand,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Enroll
                </button>
              </div>
            </>
          )}
          {phase === "submitting" && (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
              Enrolling…
            </div>
          )}
          {phase === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle size={40} color={C.success} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>
                Face enrolled!
              </div>
              <button
                onClick={() => {
                  onEnrolled?.();
                  onClose();
                }}
                style={{
                  marginTop: 10,
                  padding: "9px 24px",
                  borderRadius: 9,
                  border: "none",
                  background: C.brand,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
          {phase === "error" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.danger, marginBottom: 6 }}>
                Error
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{err}</div>
              <button
                onClick={onClose}
                style={{
                  padding: "9px 24px",
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.muted,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </>
  );
}
