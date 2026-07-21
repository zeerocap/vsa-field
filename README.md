# VSA Field

Field-marketing app for Vision Academy. Two surfaces from one build:

- **PRO** — mobile PWA for field reps: check in/out, log activities, capture leads, claim expenses, track targets.
- **Admin** — desktop console: live PRO tracking, GPS trails, sessions, venues, leads, targets, expenses, territory, photos, face ID.

Anti-fraud is the point of the app: face verification on check-in, GPS geofencing,
a location trail, auto-checkout of stale sessions, and a per-session trust score.

## Running it

```bash
npm install
cp .env.example .env.local     # then fill in VITE_GMAP_KEY
npm run dev
```

| Variable        | Required | Notes                                                                                   |
| --------------- | -------- | --------------------------------------------------------------------------------------- |
| `VITE_API_URL`  | no       | Defaults to production (`vsa-crm-api.onrender.com`)                                     |
| `VITE_GMAP_KEY` | **yes**  | Google Maps JS key. Without it the Map, Live and Trail tabs render blank with no error. |

## Layout

```
src/
  pages/Login.jsx
  pages/pro/          PRO screens, one file per route
  pages/admin/        AdminPage.jsx — all 14 admin tabs, hash-routed (#overview, #live, …)
  components/         Layout, ui.jsx primitives, Icons
  hooks/              useAuth, useResponsive, useLocationTracker
  api/field.api.js    thin wrappers over utils/api.js
  constants/theme.js  design tokens (C) — brand #7e1749
```

Admin tabs are selected by URL hash, not react-router. The id list lives in
`ADMIN_TAB_IDS` (exported from `AdminPage.jsx`) and `Layout.jsx` imports it —
add a tab there, not in two places.

## Conventions

- `utils/api.js` `call()` **always returns `{ ok, ... }` and never throws.** Check
  `res.ok`; do not wrap calls in try/catch expecting a rejection.
- Colours come from `constants/theme.js`. Add a token rather than a new hex.
- `npm run lint` and `npm run format` before pushing; a pre-commit hook runs both
  on staged files.

## Backend

All calls POST a single action to `vsa-crm-api`. Field handlers live in
`vsa-crm-api/src/handlers/field.handlers.js` and `trail.handlers.js`.

Tables: `field_live_sessions`, `field_activities`, `field_venues`, `field_leads`,
`field_expenses`, `field_targets`, `field_territories`, `field_photos`,
`pro_location_trail`.
