import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty, FormError } from "../../components/ui.jsx";
import { useToast } from "../../components/ui.jsx";
import Icon from "../../components/Icons.jsx";
import { getExpenses, addExpense } from "../../api/field.api.js";

const CATS = ["Travel","Food","Printing","Event Materials","Gifts","Stationary","Accommodation","Other"];

const CAT_META = {
  Travel:            { icon: "navigation", color: C.brand },
  Food:              { icon: "trending-up", color: C.success },
  Printing:          { icon: "clipboard", color: "#7C3AED" },
  "Event Materials": { icon: "target", color: C.warning },
  Gifts:             { icon: "award", color: "#EC4899" },
  Accommodation:     { icon: "building", color: C.info },
  Other:             { icon: "wallet", color: C.muted },
};

export default function ProExpenses() {
  const toast = useToast();
  const [loadErr, setLoadErr] = useState(null);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
  const [form,    setForm]    = useState({
    // `date` is required by the backend and was never collected — every expense
    // was rejected. `notes` and `bill_photo` are the real column names; the old
    // description/receipt_url keys were silently dropped.
    category: "Travel", amount: "", date: new Date().toISOString().slice(0, 10),
    notes: "", bill_photo: "",
  });

  const load = () => {
    setLoading(true);
    getExpenses({})
      .then(r => setItems(r?.expenses || []))
      .catch(e => setLoadErr(e.message || "Could not load. Check your connection."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = items.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pending = items.filter(e => !e.approved).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const openNew = () => {
    setErr("");
    setForm({ category: "Travel", amount: "", date: new Date().toISOString().slice(0, 10), notes: "", bill_photo: "" });
    setOpen(true);
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { setErr("Enter a valid amount"); return; }
    if (!form.date) { setErr("Pick a date"); return; }
    setErr(""); setSaving(true);
    try {
      const res = await addExpense({ ...form, amount: Number(form.amount) });
      if (!res.ok) { setErr(res.error || "Failed to save"); return; }
      setOpen(false);
      toast("Expense logged!", "success");
      load();
    } catch (e) { setErr(e.message || "Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormError msg={loadErr} />

      {/* Header + summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20, color: C.text }}>Expenses</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{items.length} entries</div>
        </div>
        <Btn onClick={openNew} size="sm">+ Add Expense</Btn>
      </div>

      {/* Summary cards */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.5,
              textTransform: "uppercase", marginBottom: 4 }}>Total Claimed</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.brand }}>₹{total.toLocaleString()}</div>
          </Card>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.5,
              textTransform: "uppercase", marginBottom: 4 }}>Pending Approval</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.warning }}>₹{pending.toLocaleString()}</div>
          </Card>
        </div>
      )}

      {items.length === 0 ? (
        <Empty msg="No expenses logged yet" icon="wallet" action={openNew} actionLabel="Log first expense" />
      ) : items.map((ex, i) => {
        const meta = CAT_META[ex.category] || CAT_META.Other;
        return (
          <Card key={i} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: meta.color + "15", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={meta.icon} size={18} color={meta.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
                    ₹{Number(ex.amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{ex.description || ex.category}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
                    <span style={{ background: meta.color + "15", color: meta.color, borderRadius: 20,
                      padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{ex.category}</span>
                    {ex.approved
                      ? <span style={{ background: C.successBg, color: C.success, borderRadius: 20,
                          padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>✓ Approved</span>
                      : <span style={{ background: C.warningBg, color: C.warning, borderRadius: 20,
                          padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>Pending</span>
                    }
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {new Date(ex.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
                {ex.receipt_url && (
                  <a href={ex.receipt_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: C.brand, fontWeight: 600, marginTop: 4, display: "block" }}>
                    Receipt →
                  </a>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Expense">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormError msg={err} />
          <Select label="Category" value={form.category} onChange={e => F("category", e.target.value)}
            options={CATS.map(c => ({ value: c, label: c }))} />
          <Input label="Amount (₹)" value={form.amount} onChange={e => F("amount", e.target.value)}
            type="number" min="1" required placeholder="0" />
          <Input label="Date" value={form.date} onChange={e => F("date", e.target.value)}
            type="date" required />
          <Input label="Description" value={form.notes} onChange={e => F("notes", e.target.value)}
            placeholder="What was this expense for?" />
          <Input label="Receipt URL (optional)" value={form.bill_photo}
            onChange={e => F("bill_photo", e.target.value)}
            placeholder="Photo link or URL" />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%", marginTop: 4 }}>
            {saving ? "Saving…" : "Log Expense"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
