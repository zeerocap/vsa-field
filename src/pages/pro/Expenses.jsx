import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import { getExpenses, addExpense } from "../../api/field.api.js";

const CATS = ["Travel","Food","Printing","Gifts","Event Materials","Stationary","Other"];

export default function ProExpenses() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ category: "Travel", amount: "", description: "", receipt_url: "" });

  const load = () => {
    getExpenses({}).then(r => setItems(r?.expenses || r || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = items.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  async function handleSave(e) {
    e.preventDefault(); if (!form.amount) return; setSaving(true);
    try {
      await addExpense({ ...form, amount: Number(form.amount) });
      setOpen(false); setForm({ category: "Travel", amount: "", description: "", receipt_url: "" }); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Expenses</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Total: ₹{total.toLocaleString()}</div>
        </div>
        <Btn onClick={() => setOpen(true)}>+ Add Expense</Btn>
      </div>

      {items.length === 0 ? <Empty msg="No expenses yet" icon="wallet" /> : items.map((ex, i) => (
        <Card key={i} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ background: C.accentBg, color: C.accent, borderRadius: 20,
                  padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{ex.category}</span>
                {ex.approved && <span style={{ background: C.successBg, color: C.success, borderRadius: 20,
                  padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>Approved</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>₹{Number(ex.amount).toLocaleString()}</div>
              {ex.description && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{ex.description}</div>}
            </div>
            <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
              {new Date(ex.created_at).toLocaleDateString()}
              {ex.receipt_url && (
                <div style={{ marginTop: 4 }}>
                  <a href={ex.receipt_url} target="_blank" rel="noreferrer"
                    style={{ color: C.brand, fontSize: 11 }}>Receipt →</a>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Expense">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select label="Category" value={form.category} onChange={e => F("category", e.target.value)}
            options={CATS.map(c => ({ value: c, label: c }))} />
          <Input label="Amount (₹)" value={form.amount} onChange={e => F("amount", e.target.value)}
            type="number" required placeholder="0.00" />
          <Input label="Description" value={form.description} onChange={e => F("description", e.target.value)}
            placeholder="What was it for?" />
          <Input label="Receipt URL" value={form.receipt_url} onChange={e => F("receipt_url", e.target.value)}
            placeholder="Photo/link (optional)" />
          <Btn type="submit" disabled={saving} size="lg" style={{ width: "100%" }}>
            {saving ? "Saving..." : "Add Expense"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
