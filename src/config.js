// API base. Sourced from the environment so staging/preview builds can point
// elsewhere; the fallback preserves current production behaviour.
export const API_BASE = import.meta.env.VITE_API_URL || "https://vsa-crm-api.onrender.com";

// NOTE: the Google Maps key is NOT here. It is read directly from
// import.meta.env.VITE_GMAP_KEY where it is used. A placeholder constant used to
// live here and was imported by nothing — a trap for anyone who found it first.
