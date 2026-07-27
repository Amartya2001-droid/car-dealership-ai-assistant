# Day 9 - Supabase Adapter Delivery (2026-04-11)

## What Changed
- Implemented `src/dataStore.js` as a DB-first persistence layer.
- Added Supabase REST read/write support for:
  - leads
  - follow-ups
  - appointments
- Added automatic fallback to local JSON storage if Supabase is unavailable.
- Migrated these flows to use the shared async data store:
  - `POST /simulate/call`
  - Twilio voice collect webhook
  - follow-up queue + morning dispatch
  - admin lead/appointment/callback endpoints
  - summary + dashboard overview endpoints
- Updated helper scripts (`summary`, `export:leads`, `seed:demo`) to read through the same adapter.

## Verification
- `npm test` (includes new persistence-mode tests)
- `npm run check:env`
- `npm run summary`

## Notes
- Supabase integration expects JSON payload tables. See `docs/supabase-setup.md`.
- If Supabase credentials are absent or remote calls fail, the service keeps operating with local JSON files.
