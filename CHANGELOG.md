# Changelog

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
