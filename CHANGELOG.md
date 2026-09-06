# Changelog

## 2026-09-06 (Reliability Fixes)
- Replaced `Date.now()`-only ids for leads, appointments, and follow-ups with a collision-resistant generator (concurrent requests could previously produce duplicate ids).
- Logged Supabase fallback failures instead of silently swallowing them — a degraded Supabase connection in production was previously invisible.
- Fixed the rate limiter's in-memory hit tracker growing unbounded on a long-running process by periodically sweeping expired entries.
- Recolored the last component still on the old ad-hoc Tailwind palette (`DemoOperationsPanel`) onto the shared brand tokens.
- Documented `EXPOSE_ERROR_DETAILS`/`DATA_DIR` in the env templates, and added README coverage for the security/production-hardening features and the shared design system.

## 2026-08-24 (Shared Design System)
- Replaced the React dashboard's default shadcn placeholder tokens and Inter/Playfair fonts with the dealership's real brand colors (derived from the existing `public/dashboard.css` values) and Source Serif 4 / Manrope.
- Added a "Night Operations" dark theme and a persisted toggle to the built-in dashboard, the React dashboard, and the new landing page — all three share one `localStorage` key.
- Replaced the built-in dashboard's four separately-shadowed KPI cards with one ruled grid, and fixed several colors that were hardcoded instead of theme-variable-driven (would have broken under dark mode).
- Recolored the React dashboard's header, KPI cards, and lead/appointment/follow-up badges off the default Tailwind palette (17+ unrelated hues) onto the brand tokens.
- Added a marketing landing page at `/` for the after-hours AI product itself, grounded in real product features with no fabricated testimonials.

## 2026-08-21 (Security & Production Hardening)
- Added Twilio webhook signature validation (automatic once `TWILIO_AUTH_TOKEN` is set).
- Added an admin API key gate on lead/appointment/follow-up admin routes.
- Added a configurable CORS origin allowlist, baseline security response headers, and rate limiting on the public simulate-call endpoint.
- Added consistent JSON error handling/404s, graceful shutdown on `SIGTERM`/`SIGINT`, and structured JSON request logging.

## 2026-07-04 (Launch Action Plan)
- Added a dependency-based `nextActionPlan` to the launch checklist payload.
- Split rollout actions into local tasks, credential-backed blockers, and verification gates.
- Surfaced the action plan in the React operations dashboard.
- Updated launch checklist tests and README guidance for the new operator view.

## 2026-06-24 (Recorded Demo Run Sheet)
- Added a reusable demo run-sheet builder for scenario-specific recording guidance.
- Added `GET /admin/demo/run-sheet/:scenarioId` and `npm run demo:run-sheet -- <scenarioId>`.
- Linked run-sheet discovery from the demo overview workflow and updated demo docs.
- Added tests covering run-sheet commands, caller script, and proof points.

## 2026-04-11 (Supabase Persistence)
- Added `src/dataStore.js` with Supabase REST persistence for leads, follow-ups, and appointments.
- Added automatic runtime fallback to local JSON persistence when Supabase is unavailable.
- Migrated server/follow-up/scheduler flows to the shared async persistence adapter.
- Updated environment docs with Supabase table schema and configurable table/column names.
- Added persistence status tests for `local_fallback` and `remote_ready` modes.

## 2026-03-17 (Dashboard Ops Polish)
- Added a manual dashboard refresh button and filtered lead totals.
- Added showroom links in lead cards, appointment status badges, and callback tokens.
- Added a quick links panel and runtime-aware source label to the dashboard.

## 2026-03-16 (Dashboard Enhancements)
- Added dashboard filters for lead search, topic, and status.
- Added runtime status visibility to the dashboard using `GET /admin/runtime`.
- Added an attention queue for urgent leads and callback-heavy follow-up items.

## 2026-03-15 (Persistence Prep)
- Added Supabase environment placeholders and runtime storage-provider config.
- Added a persistence status helper and `GET /admin/runtime` endpoint.
- Added an environment validation script (`npm run check:env`).
- Added Supabase setup notes and updated README usage.

## 2026-03-13 (Dashboard)
- Added a staff-facing monitoring dashboard at `GET /dashboard`.
- Added a styled static UI for summary cards, recent leads, appointments, and follow-up queue visibility.
- Served dashboard assets through Express so the dashboard ships with the API.
- Updated README and architecture docs to include dashboard usage.

## 2026-03-11 (Day 3)
- Added callback window extraction so leads can store preferred contact times.
- Added virtual showroom asset generation for matched vehicle leads.
- Added admin summary endpoint for lead, appointment, and follow-up counts.
- Enriched follow-up messages with callback preferences and showroom links.
- Added tests covering callback preference extraction and enriched lead records.

## 2026-03-09 (Day 2)
- Added test-drive scheduling service with Google Calendar + mock fallback providers.
- Added appointment persistence and admin appointment endpoints.
- Added lead lifecycle status (`new`, `scheduled`, `pending_schedule`, `contacted`) with timeline updates.
- Wired automatic scheduling for test-drive intents from Twilio and simulated calls.
- Added tests for lifecycle defaults and preferred date/time parsing.

## 2026-03-08 (Day 1)
- Initialized `car-dealership-ai-assistant` Node.js project.
- Added Twilio voice webhooks and simulation endpoint.
- Implemented AI assistant core logic with persona, mood, topic, urgency.
- Added vehicle preference parsing and matching against inventory snapshot.
- Added lead capture and queued follow-up pipeline.
- Added weekday scheduler for morning digest/follow-up dispatch.
- Added knowledge base update endpoints and website sync script.
- Added tests and architecture/day progress documentation.
