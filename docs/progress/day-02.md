# Day 2 Progress - Test Drive Scheduling and Lead Lifecycle

Date: 2026-03-09

## What Was Built
- Added test-drive scheduling service (`src/testDriveScheduler.js`) with:
  - Date/time extraction from caller inquiry text.
  - Google Calendar event creation when credentials are provided.
  - Automatic fallback to local `mock_calendar` appointment storage.
- Added appointment persistence (`data/appointments.json`) and storage helpers.
- Added lead lifecycle model:
  - New fields: `status`, `lifecycle`, `appointmentId`.
  - Lifecycle transitions appended when scheduling/confirming.
- Extended API with admin scheduling endpoints:
  - `GET /admin/appointments`
  - `POST /admin/test-drives/schedule`
  - `POST /admin/test-drives/:appointmentId/confirm`
- Updated Twilio and simulation call paths to auto-trigger scheduling for test-drive topics.

## Deliverables
- End-to-end Day 2 flow for voice-requested test-drive scheduling.
- Staff confirmation endpoint to progress lead status after outreach.
- Backward-compatible operation in no-credentials mode.

## Verification
- `npm test` passes with new scheduling/lifecycle tests.
- `POST /simulate/call` with test-drive intent returns an `appointment` object.
- `GET /admin/appointments` lists created appointment records.

## Risks / Gaps
- Google Calendar access currently uses bearer token env input; token refresh automation is not yet implemented.
- NLP date parsing is intentionally lightweight and should be upgraded for complex utterances.

## Plan for Day 3
- Add Supabase-backed persistence as primary store.
- Keep JSON fallback for local quickstart and offline testing.
- Start basic dashboard skeleton for lead/appointment triage.
