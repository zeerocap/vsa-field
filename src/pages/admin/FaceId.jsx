import { useState, useEffect, useCallback } from "react";
import { User, RefreshCw, ScanFace, CheckCircle, AlertCircle } from "lucide-react";
import C from "../../constants/theme.js";
import { displayName, fetchUsersApi, revokeFaceApi } from "./_shared.jsx";
import EnrollFaceModal from "./EnrollFaceModal.jsx";

export default function FaceIdTab({ authUser, isMobile }) {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetchUsersApi(authUser.token);
    setLoading(false);
    if (res.ok) setUsers((res.users || []).filter((u) => u.role === "pro"));
    else setError(res.error || "Failed to load PRO users");
  }, [authUser.token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRevoke = async (username) => {
    setConfirmRevoke(null);
    const res = await revokeFaceApi(authUser.token, { username });
    if (res.ok) loadUsers();
    else setError(res.error || "Failed to revoke");
  };

  const pros = users || [];
  const enrolled = pros.filter((u) => u.faceEnrolled).length;
  const notEnrolled = pros.filter((u) => !u.faceEnrolled).length;

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total PROs", value: pros.length, color: C.info },
          { label: "Face Enrolled", value: enrolled, color: C.success },
          { label: "Not Enrolled", value: notEnrolled, color: C.warning },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "14px 20px",
              flex: 1,
              minWidth: 100,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>
              {loading ? "—" : s.value}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: "#FFF1F2",
            border: `1px solid #FECACA`,
            borderRadius: 10,
            padding: "11px 16px",
            marginBottom: 14,
            fontSize: 13,
            color: C.danger,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={14} color={C.danger} /> {error}
        </div>
      )}

      <div
        style={{
          background: C.card,
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px 12px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>PRO Face Credentials</div>
          <button
            onClick={loadUsers}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            Loading PRO users…
          </div>
        ) : pros.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            No PRO users found. Add PRO users in Settings.
          </div>
        ) : (
          <div>
            {pros.map((u, i) => (
              <div
                key={u.username}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  padding: "14px 20px",
                  borderBottom: i < pros.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                {/* User info */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: `${C.brand}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: 14,
                      color: C.brand,
                    }}
                  >
                    {(u.displayName || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: C.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.displayName || u.username}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {u.username} · {u.centre || "—"}
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div style={{ flexShrink: 0 }}>
                  {u.faceEnrolled ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#ECFDF5",
                        color: C.success,
                        borderRadius: 20,
                        padding: "4px 11px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle size={12} strokeWidth={2.5} /> Enrolled
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#FFF7ED",
                        color: C.warning,
                        borderRadius: 20,
                        padding: "4px 11px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <AlertCircle size={12} strokeWidth={2.5} /> Not enrolled
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {u.faceEnrolled ? (
                    <button
                      onClick={() => setConfirmRevoke(u.username)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: `1px solid #7C3AED40`,
                        background: `${C.purple}08`,
                        color: C.purple,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      <ScanFace size={13} /> Re-Enroll
                    </button>
                  ) : (
                    <button
                      onClick={() => setEnrollTarget(u)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: `1px solid #7C3AED60`,
                        background: `${C.purple}14`,
                        color: C.purple,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      <ScanFace size={13} /> Enroll Face
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div style={{ marginTop: 14, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
        Face credentials allow automatic identity verification when a PRO logs into Field Tracker.
        Models load from{" "}
        <code style={{ background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>
          /public/models
        </code>
        .
      </div>

      {/* Enroll modal */}
      {enrollTarget && (
        <EnrollFaceModal
          authUser={authUser}
          target={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onEnrolled={() => {
            setEnrollTarget(null);
            loadUsers();
          }}
        />
      )}

      {/* Confirm re-enroll */}
      {confirmRevoke && (
        <>
          <div
            onClick={() => setConfirmRevoke(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 80,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "#fff",
              borderRadius: 14,
              padding: "28px 24px",
              zIndex: 90,
              boxShadow: "0 4px 32px rgba(0,0,0,0.14)",
              maxWidth: 360,
              width: "90%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#F5F3FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <ScanFace size={22} color={C.purple} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>
              Re-enroll face for {confirmRevoke}?
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              The existing credential will be replaced. The PRO must re-verify on next login.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmRevoke(null)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.muted,
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = pros.find((u) => u.username === confirmRevoke);
                  setConfirmRevoke(null);
                  setEnrollTarget(target);
                }}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 9,
                  border: "none",
                  background: C.purple,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Re-Enroll
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
