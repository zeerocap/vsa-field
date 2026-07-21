import { API_BASE } from "../config.js";
import { getToken } from "./auth.js";

// Returns { ok, ... } and NEVER throws.
//
// This used to throw on both a non-2xx response and on `data.error`. AdminPage is
// written against a {ok:false} contract — it has ~20 `else setError(res.error)`
// branches — so every one of those was unreachable dead code, and loaders without
// a .catch never reached setLoading(false), leaving five admin tabs spinning
// forever on any failure. LiveTab additionally re-threw every 30s from its poll.
export async function call(action, params = {}) {
  const token = getToken();
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, token, ...params }),
    });
    if (!res.ok) return { ok: false, error: `Server error (HTTP ${res.status})` };

    const data = await res.json();
    // Handlers report failure as { ok:false, error } or a bare { error }.
    if (data?.error) return { ok: false, error: data.error, ...data };
    // Success payloads already carry ok:true; default it for any that don't.
    return { ok: true, ...data };
  } catch (e) {
    // Network down, DNS failure, offline PWA — a field app's normal condition.
    return { ok: false, error: e.message === "Failed to fetch"
      ? "No connection. Check your network and try again."
      : (e.message || "Request failed") };
  }
}
