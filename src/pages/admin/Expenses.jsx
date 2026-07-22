import { useState, useEffect, useCallback } from "react";
import C from "../../constants/theme.js";
import { call } from "../../utils/api.js";

export default function ExpensesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await call("getFieldExpenses", {});
    if (r.ok) {
      setItems(r.expenses || []);
      setError("");
    } else setError(r.error || "Could not load expenses");
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function review(id, status) {
    setBusy(id);
    const r = await call("reviewFieldExpense", { expenseId: id, status });
    setBusy(null);
    if (r.ok) load();
    else setError(r.error || "Could not update the claim");
  }

  const rows = items.filter((e) => filter === "all" || (e.status || "pending") === filter);
  const sum = rows.reduce((s, e) => s + Number(e.amount || 0), 0);
  const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
  const chip = { pending: C.warning, approved: C.success, rejected: C.danger };

  if (loading)
    return <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Loading…</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
              textTransform: "capitalize",
              border: `1.5px solid ${filter === f ? C.brand : C.border}`,
              background: filter === f ? C.brand : C.card,
              color: filter === f ? "#fff" : C.muted,
            }}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, color: C.muted }}>
          {rows.length} claim(s) · <strong style={{ color: C.text }}>{money(sum)}</strong>
        </span>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            background: C.dangerBg,
            border: `1px solid ${C.danger}40`,
            borderRadius: 8,
            fontSize: 13,
            color: C.danger,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {!rows.length ? (
        <div style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 14 }}>
          No {filter === "all" ? "" : filter} expense claims.
        </div>
      ) : (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {["PRO", "Date", "Category", "Amount", "Notes", "Status", ""].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textAlign: i === 3 ? "right" : "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const st = e.status || "pending";
                return (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: C.text }}>
                      {e.pro_username}
                      <div style={{ fontSize: 11, color: C.faint }}>{e.centre}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: C.muted, whiteSpace: "nowrap" }}>
                      {e.date}
                    </td>
                    <td style={{ padding: "10px 14px", color: C.text }}>{e.category}</td>
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: C.text,
                      }}
                    >
                      {money(e.amount)}
                    </td>
                    <td style={{ padding: "10px 14px", color: C.muted, maxWidth: 260 }}>
                      {e.notes || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: 99,
                          background: `${chip[st]}18`,
                          color: chip[st],
                          textTransform: "capitalize",
                        }}
                      >
                        {st}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      {st === "pending" && (
                        <>
                          <button
                            disabled={busy === e.id}
                            onClick={() => review(e.id, "approved")}
                            style={{
                              padding: "5px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 7,
                              border: `1px solid ${C.success}`,
                              background: C.success,
                              color: "#fff",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              marginRight: 6,
                            }}
                          >
                            {busy === e.id ? "…" : "Approve"}
                          </button>
                          <button
                            disabled={busy === e.id}
                            onClick={() => review(e.id, "rejected")}
                            style={{
                              padding: "5px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 7,
                              border: `1px solid ${C.danger}`,
                              background: C.card,
                              color: C.danger,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
