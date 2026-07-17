import { API_BASE } from "../config.js";
import { getToken } from "./auth.js";

export async function call(action, params = {}) {
  const token = getToken();
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token, ...params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
