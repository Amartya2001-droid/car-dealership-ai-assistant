# Demo Script

## Prep

1. Run `npm run demo:prepare`.
2. Confirm the output reports `"ready": true`.
3. Run `npm run demo:overview` and keep that output handy as the run-of-show.
4. Optionally run `npm run demo:scenario` to list the named scenario ids.
5. Start the app with `npm start` or `npm run dev`.
6. Open `/dashboard` or `/ops-dashboard/`.

## Recording Flow

1. Show `GET /health` returning service metadata.
2. Show `npm run demo:overview` or `GET /admin/demo-overview` so viewers see:
   - demo readiness
   - production readiness
   - named scenarios
   - recording flow steps
3. Show `GET /admin/demo-scenarios` or `npm run demo:scenario` to preview the available walkthrough scenarios.
4. Run one named scenario live:
   ```bash
   npm run demo:scenario -- test-drive-booking
   ```
5. Show the returned lead, appointment, and queued follow-up.
6. Show `/admin/summary` reflecting the updated counts.
7. Show `/admin/appointments` with the scheduled test drive.
8. Show `/admin/followups` with the queued customer follow-up.
9. End on `/dashboard` or `/ops-dashboard/` with the updated KPI cards.

## Alternative Live API Flow

If you want to demo the HTTP endpoints directly instead of the CLI:

```bash
curl http://localhost:3000/admin/demo-overview
curl http://localhost:3000/admin/demo-scenarios
curl -X POST http://localhost:3000/admin/demo/scenarios/test-drive-booking/run
```

## Talk Track

- The system accepts Twilio-compatible after-hours calls and also supports local simulated/demo scenarios.
- Leads are tagged by topic, urgency, mood, callback window, and vehicle match.
- Appointments and follow-up messages are created automatically during the scenario flow.
- The dashboard gives staff a next-morning triage surface.
- Production readiness is visible through `/admin/production-readiness`; demo readiness is visible through `/admin/demo-readiness`; the full operator walkthrough is available through `/admin/demo-overview`.
