# Demo Script

## Prep

1. Run `npm run demo:prepare`.
2. Confirm the output reports `"ready": true`.
3. Start the app with `npm start` or `npm run dev`.
4. Open `/dashboard` or `/ops-dashboard/`.

## Recording Flow

1. Show `GET /health` returning service metadata.
2. Show `npm run demo:ready` or `GET /admin/demo-readiness` so viewers see the dashboard and demo data gates.
3. Simulate a caller asking for an SUV, test drive, and callback:
   ```bash
   curl -X POST http://localhost:3000/simulate/call \
     -H 'Content-Type: application/json' \
     -d '{"phone":"+19025550123","callerName":"Taylor","message":"I want a small hybrid SUV under $40000, book a test drive tomorrow at 3 pm, and text me a follow up","persona":"concierge","optInFollowUp":true}'
   ```
4. Show the returned assistant reply, lead record, showroom asset, appointment, and follow-up object.
5. Show `/admin/summary` reflecting the new lead.
6. Show `/admin/appointments` with the scheduled test drive.
7. Show `/admin/followups` with the queued customer follow-up.
8. End on `/dashboard` or `/ops-dashboard/` with the updated KPI cards.

## Talk Track

- The system accepts Twilio-compatible after-hours calls and also supports local simulated calls for demos.
- Leads are tagged by topic, urgency, mood, callback window, and vehicle match.
- The dashboard gives staff a next-morning triage surface.
- Production readiness is visible through `/admin/production-readiness`; demo readiness is visible through `/admin/demo-readiness`.
