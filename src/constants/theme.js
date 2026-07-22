// ─────────────────────────────────────────────────────────────────────────────
// VSA Design System v2.0 — Vision School of Aviation
// Canonical tokens, identical in value to vsa-crm / vsa-hrms. Do not drift these;
// they are the single source of truth for colour, elevation, radius and type
// across every VSA app.
// ─────────────────────────────────────────────────────────────────────────────

export const C = {
  // Brand
  brand: "#7e1749", // primary — buttons, active nav, links
  brandLight: "#F5E6EE", // brand tint — hover chips, backgrounds
  brandDark: "#5c1035", // brand dark — pressed states

  // Surfaces
  bg: "#F7F8FA", // page background
  card: "#FFFFFF", // card / panel / modal background
  sidebar: "#FFFFFF", // sidebar background

  // Borders
  border: "#E8E8E8", // default border on all cards, inputs, tables

  // Text
  text: "#111827", // primary body text
  muted: "#6B7280", // secondary text, labels, icons default
  faint: "#9CA3AF", // placeholder, timestamps, captions

  // Semantic — success
  success: "#16A34A",
  successBg: "#F0FDF4",

  // Semantic — warning
  warning: "#D97706",
  warningBg: "#FFFBEB",

  // Semantic — danger
  danger: "#DC2626",
  dangerBg: "#FEF2F2",

  // Semantic — info
  info: "#2563EB",
  infoBg: "#EFF6FF",

  // Semantic — purple (callbacks, special status)
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",

  // Semantic — orange (visited, pending)
  orange: "#EA580C",
  orangeBg: "#FFF7ED",

  // Back-compat aliases for older Field code. `brandBg` was the drifted key name
  // (and a drifted value); it now points at the canonical brandLight so existing
  // references render the correct tint. Prefer brandLight in new code.
  get brandBg() {
    return this.brandLight;
  },
};

// Shadows — use these values only, never custom shadows
export const SHADOW = {
  card: "0 1px 3px rgba(0,0,0,0.06)", // default card elevation
  raised: "0 4px 12px rgba(0,0,0,0.08)", // dropdown, tooltip, popover
  high: "0 8px 24px rgba(0,0,0,0.10)", // modal, drawer, sheet
};

// Border radius — use these values only
export const RADIUS = {
  xs: 4, // badges, small chips
  sm: 6, // inputs (secondary)
  md: 7, // nav items, buttons, inputs
  lg: 10, // cards (standard)
  xl: 12, // large cards, modals, sheets
};

// Font scale — fontSize + fontWeight pairs
export const FONT = {
  display: { fontSize: 20, fontWeight: 700 }, // hero numbers, page display
  heading: { fontSize: 16, fontWeight: 600 }, // section headings, card titles
  subheading: { fontSize: 14, fontWeight: 600 }, // table headers, modal titles
  body: { fontSize: 13, fontWeight: 400 }, // default body, table cells
  small: { fontSize: 12, fontWeight: 400 }, // labels, captions
  micro: { fontSize: 11, fontWeight: 400 }, // timestamps, badge text
  tiny: { fontSize: 10, fontWeight: 500 }, // status dots, tag labels
};

// Back-compat: many Field files still `import C from "..."`. Keep the default
// export working while the codebase migrates to the named `{ C }` import the
// sibling apps use. New code should use the named export.
export default C;
