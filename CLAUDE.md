# VSA Field — Claude Code Context

Repo: https://github.com/zeerocap/vsa-field · Deploys to Vercel.

**Brand: `#7e1749` maroon**, from `src/constants/theme.js` (default export `C`).
An earlier version of this file said `#065f46` green — that has not been true
since the HRMS-style redesign. Do not reintroduce it.

PWA. PRO mobile + Admin desktop, one build, split by role in `App.jsx`.

Anti-fraud: face verify on check-in, GPS geofence, location trail, auto-checkout
after 4h, trust score.

## Things that are easy to get wrong here

- `utils/api.js` `call()` returns `{ ok, ... }` and **never throws**. Code that
  wraps it in try/catch expecting a rejection will silently treat failure as
  success.
- Admin tab ids live in `ADMIN_TAB_IDS`, exported from `AdminPage.jsx` and
  imported by `Layout.jsx`. They used to be duplicated in four places.
- `VITE_GMAP_KEY` is read directly from `import.meta.env` where used. There is no
  key in `config.js`.
- All 14 admin tabs are in `AdminPage.jsx`. The per-tab files that used to sit
  beside it were dead code and have been deleted.

Tables: field_live_sessions, field_activities, field_venues, field_leads,
field_expenses, field_targets, field_territories, field_photos, pro_location_trail
