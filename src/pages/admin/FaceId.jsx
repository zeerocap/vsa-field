import { useState, useEffect, useRef, useCallback } from "react";
import C from "../../constants/theme.js";
import { Spinner } from "../../components/ui.jsx";
import { getUsers, enrollFaceApi, revokeFaceApi } from "../../api/field.api.js";
import Icon from "../../components/Icons.jsx";

// ── Camera capture modal ─────────────────────────────────────────────────────
function EnrollModal({ target, onClose, onEnrolled }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const [phase,     setPhase]     = useState("camera"); // camera | preview | submitting | done | error
  const [photo,     setPhoto]     = useState(null);
  const [errMsg,    setErrMsg]    = useState("");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      })
      .catch(() => { setPhase("error"); setErrMsg("Camera not available. Allow camera permission and retry."); });
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  function capture() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = 320;
    canvas.height = 240;
    canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
    setPhoto(canvas.toDataURL("image/jpeg", 0.8));
    streamRef.current?.getTracks().forEach(t => t.stop());
    setPhase("preview");
  }

  async function submit() {
    setPhase("submitting");
    try {
      const r = await enrollFaceApi({ username: target.username, photoBase64: photo });
      if (r.ok !== false) { setPhase("done"); onEnrolled(); }
      else { setPhase("error"); setErrMsg(r.error || "Enrollment failed"); }
    } catch (e) {
      setPhase("error"); setErrMsg(e.message || "Enrollment failed");
    }
  }

  function retake() {
    setPhoto(null); setPhase("camera");
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      });
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", zIndex: 80 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 16, zIndex: 90, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: "min(95vw,380px)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Enroll Face — {target.display_name || target.username}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Look straight at the camera and capture</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={18} color={C.muted} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {phase === "camera" && (
            <>
              <div style={{ width: "100%", aspectRatio: "4/3", background: "#111", borderRadius: 10, overflow: "hidden", marginBottom: 14, position: "relative" }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />
                {/* Face guide overlay */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ width: "56%", aspectRatio: "3/4", border: "2px dashed rgba(255,255,255,0.4)", borderRadius: "50%", opacity: 0.7 }} />
                </div>
              </div>
              <button onClick={capture}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: C.brand, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Icon name="camera" size={16} color="#fff" /> Capture Photo
              </button>
            </>
          )}

          {phase === "preview" && (
            <>
              <div style={{ width: "100%", aspectRatio: "4/3", background: "#111", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                <img src={photo} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={retake}
                  style={{ flex: 1, padding: "11px", borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", color: C.muted, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  Retake
                </button>
                <button onClick={submit}
                  style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: C.brand, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Enroll
                </button>
              </div>
            </>
          )}

          {phase === "submitting" && (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
              <Spinner />
              <div style={{ marginTop: 10 }}>Enrolling face…</div>
            </div>
          )}

          {phase === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Icon name="check-circle" size={26} color={C.success} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>Face enrolled successfully</div>
              <button onClick={onClose} style={{ marginTop: 10, padding: "9px 24px", borderRadius: 9, border: "none", background: C.brand, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Done
              </button>
            </div>
          )}

          {phase === "error" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.danger, marginBottom: 6 }}>Error</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{errMsg}</div>
              <button onClick={onClose} style={{ padding: "9px 24px", borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", color: C.muted, fontSize: 13, cursor: "pointer" }}>
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

// ── Main FaceId page ─────────────────────────────────────────────────────────
export default function AdminFaceId() {
  const [pros,          setPros]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [enrollTarget,  setEnrollTarget]  = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const loadPros = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await getUsers();
      setPros((r?.users || r || []).filter(u => u.role === "pro"));
    } catch (e) {
      setError(e.message || "Failed to load PRO users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPros(); }, [loadPros]);

  async function handleRevoke(username) {
    setConfirmRevoke(null);
    try {
      await revokeFaceApi({ username });
      loadPros();
    } catch (e) {
      alert(e.message || "Failed to revoke");
    }
  }

  const proList    = pros || [];
  const enrolled   = proList.filter(u => u.face_enrolled || u.faceEnrolled).length;
  const notEnrolled= proList.filter(u => !(u.face_enrolled || u.faceEnrolled)).length;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>Face ID Management</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Manage face credentials for PRO field staff.</div>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total PROs",    value: proList.length,  color: C.info    },
          { label: "Face Enrolled", value: enrolled,        color: C.success },
          { label: "Not Enrolled",  value: notEnrolled,     color: C.warning },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: C.dangerBg, border: `1px solid #FECACA`, borderRadius: 10, padding: "11px 16px", marginBottom: 14, fontSize: 13, color: C.danger }}>
          {error}
        </div>
      )}

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>PRO Face Credentials</div>
          <button onClick={loadPros}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}>
            <Icon name="refresh" size={13} color={C.muted} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>Loading PRO users…</div>
        ) : proList.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>No PRO users found.</div>
        ) : (
          <div>
            {proList.map((u, i) => {
              const isEnrolled = u.face_enrolled || u.faceEnrolled;
              return (
                <div key={u.username} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                  padding: "14px 20px",
                  borderBottom: i < proList.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  {/* User info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${C.brand}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 14, color: C.brand }}>
                      {(u.display_name || u.username).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.display_name || u.username}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>{u.username} · {u.centre || "—"}</div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{ flexShrink: 0 }}>
                    {isEnrolled ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.successBg, color: C.success, borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 700 }}>
                        <Icon name="check-circle" size={12} color={C.success} /> Enrolled
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.warningBg, color: C.warning, borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 700 }}>
                        <Icon name="alert" size={12} color={C.warning} /> Not enrolled
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  <div style={{ flexShrink: 0 }}>
                    {isEnrolled ? (
                      <button onClick={() => setConfirmRevoke(u.username)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.brand}40`, background: `${C.brand}08`, color: C.brand, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                        <Icon name="scan-face" size={13} color={C.brand} /> Re-Enroll
                      </button>
                    ) : (
                      <button onClick={() => setEnrollTarget(u)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.brand}60`, background: `${C.brand}14`, color: C.brand, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                        <Icon name="scan-face" size={13} color={C.brand} /> Enroll Face
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
        Face credentials allow identity verification when PROs check in. The backend matches submitted photos against enrolled descriptors.
      </div>

      {/* Enroll modal */}
      {enrollTarget && (
        <EnrollModal
          target={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onEnrolled={() => { setEnrollTarget(null); loadPros(); }}
        />
      )}

      {/* Confirm re-enroll */}
      {confirmRevoke && (
        <>
          <div onClick={() => setConfirmRevoke(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: 80 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 14, padding: "28px 24px", zIndex: 90, boxShadow: "0 4px 32px rgba(0,0,0,0.14)", maxWidth: 360, width: "90%", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.brandBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon name="scan-face" size={22} color={C.brand} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>Re-enroll face for {confirmRevoke}?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>The existing credential will be replaced.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmRevoke(null)}
                style={{ flex: 1, padding: 11, borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", color: C.muted, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => {
                const tgt = proList.find(u => u.username === confirmRevoke);
                setConfirmRevoke(null); setEnrollTarget(tgt);
              }}
                style={{ flex: 1, padding: 11, borderRadius: 9, border: "none", background: C.brand, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Re-Enroll
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
