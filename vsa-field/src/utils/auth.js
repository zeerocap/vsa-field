export const getToken = () => localStorage.getItem("vsa_field_token");
export const getUser  = () => { try { return JSON.parse(localStorage.getItem("vsa_field_user")); } catch { return null; } };
export const setAuth  = (token, user) => { localStorage.setItem("vsa_field_token", token); localStorage.setItem("vsa_field_user", JSON.stringify(user)); };
export const clearAuth = () => { localStorage.removeItem("vsa_field_token"); localStorage.removeItem("vsa_field_user"); };
export const isAdmin  = (user) => user && ["admin","gm","centre_head","manager"].includes(user.role);
export const isPro    = (user) => user && user.role === "pro";
