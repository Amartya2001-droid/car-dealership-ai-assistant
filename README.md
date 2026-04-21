# Car Dealership AI Assistant

AI voice assistant for after-hours dealership calls. It answers inventory/service questions, captures leads, queues next-day follow-up messages, and supports Twilio voice integration.

## Scope Through Day 3 (Completed)
- Express server with Twilio Voice webhook endpoints.
- Conversation logic with mood/topic/urgency detection.
- Voice persona selector (`sales_pro`, `concierge`, `tech_expert`).
- Vehicle matchmaker from caller-described preferences.
- Supabase-first persistence for leads/follow-ups/appointments with automatic JSON fallback.
- Morning dispatch scheduler for staff digest + customer follow-up SMS.
- Knowledge base snapshot API + website sync script.
- Test-drive scheduling with Google Calendar provider + mock fallback.
- Lead lifecycle status tracking and appointment confirmation endpoints.
- Callback window extraction for next-business-day outreach.
- Virtual showroom brochure/walkaround links attached to matched vehicle leads.
- Admin summary endpoint for triaging leads, appointments, and follow-up backlog.

## Quick Start (under 5 min)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
   For production, start from `.env.production.example` and set real OpenAI, Twilio, Supabase, and public `BASE_URL` values.
3. Start server:
   ```bash
   npm run dev
   ```
4. Simulate a call:
   ```bash
   curl -X POST http://localhost:3000/simulate/call \
     -H "Content-Type: application/json" \
     -d '{
       "phone":"+19025551212",
       "callerName":"Alex",
       "message":"I need a small SUV under $40000 and want to book a test drive tomorrow",
       "persona":"sales_pro",
       "optInFollowUp":true
     }'
   ```

5. Open the built-in monitoring dashboard:
   ```bash
   open http://localhost:3000/dashboard
   ```

6. Optional React dashboard preview:
   ```bash
   npm run dashboard:refresh
   open http://localhost:3000/ops-dashboard/
   ```
   This rebuilds the dashboard bundle and verifies the backend-served preview route on the same origin as the API.
   If the React production build stalls, the refresh script now generates a fallback `/ops-dashboard/` shell that redirects to the built-in `/dashboard` route so the preview path stays usable.

7. Optional React dashboard workspace:
   ```bash
   npm run dashboard:install
   cp frontend/.env.example frontend/.env
   npm run dashboard:start
   ```
   This launches the separate React dev server on `http://localhost:3001` for frontend-only iteration.

8. Optional one-command setup:
   ```bash
   bash scripts/setup.sh
   ```

9. Optional demo seed data:
   ```bash
   npm run seed:demo
   ```

10. Optional local smoke check:
   ```bash
   npm run smoke
   ```

11. Optional local summary snapshot:
   ```bash
   npm run summary
   ```

12. Optional lead export:
   ```bash
   npm run export:leads
   ```

13. Optional environment validation:
    ```bash
    npm run check:env
    ```
    For production gating, use:
    ```bash
    npm run check:production
    ```
    The same production gate is also available at `GET /admin/production-readiness`.
    For a more operator-friendly snapshot with suggested actions, use:
    ```bash
    npm run print:production
    ```

14. Optional dashboard links snapshot:
   ```bash
   npm run dashboard:links
   ```

15. Optional dashboard readiness snapshot:
   ```bash
   npm run dashboard:status
   ```

16. Optional dashboard overview snapshot:
   ```bash
   npm run dashboard:overview
   ```

## Daily GitHub Contribution Flow
Run this once per day (or let automation run it) to guarantee a contribution commit:

```bash
npm run contrib
```

Optional note:

```bash
bash scripts/daily-contribution.sh "Implemented Day 2 calendar integration"
```

Behavior:
- Appends a timestamp entry to `docs/progress/heartbeat.log`.
- Creates a dated commit (`chore: daily progress YYYY-MM-DD`).
- Pushes to `origin/<current-branch>` if a GitHub remote is configured.
- If no remote is configured, it prints the exact `git remote add origin ...` command needed.

## Twilio Integration
1. Buy/configure a Twilio phone number with Voice.
2. Point Voice webhook to:
   - `POST /webhooks/twilio/voice`
3. Set Twilio credentials in `.env`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

The app works in mock mode without Twilio/OpenAI keys (`USE_MOCK_AI=true`).
Before a real pilot, set `USE_MOCK_AI=false`, configure Twilio credentials, and run `DEPLOYMENT_URL=https://your-public-url npm run verify:production-url`.

## API Endpoints
- `GET /dashboard`
- `GET /health`
- `GET /config/personas`
- `GET /admin/runtime`
- `GET /admin/dashboard-overview`
- `GET /admin/production-readiness`
- `POST /webhooks/twilio/voice`
- `POST /webhooks/twilio/voice/collect`
- `POST /simulate/call`
- `GET /admin/leads`
- `GET /admin/followups`
- `GET /admin/appointments`
- `GET /admin/summary`
- `POST /admin/test-drives/schedule`
- `POST /admin/test-drives/:appointmentId/confirm`
- `POST /admin/leads/:leadId/callback-window`
- `POST /admin/run-followups`
- `POST /admin/knowledge/snapshot`

## Data Files
- `data/leads.json`
- `data/followups.json`
- `data/knowledge-base.json`
- `data/appointments.json`

## Dashboard
The monitoring UI at `/dashboard` shows:
- lead volume and callback demand
- recent leads with intent and callback preference
- recent appointments and follow-up queue
- topic, status, and urgency breakdowns
- lead search plus topic and status filters
- runtime storage/default-persona visibility
- an attention queue for urgent or callback-heavy leads
- manual refresh controls and a last-updated stamp
- direct quick links to the main admin JSON endpoints
- showroom brochure and walkaround links inside lead cards

The imported React dashboard workspace lives in [`frontend`](./frontend). Use `/ops-dashboard/` for the stable backend-served preview and `npm run dashboard:start` for separate frontend iteration.
For quick route discovery, use `GET /admin/dashboard-links`, `GET /admin/dashboard-status`, or `npm run dashboard:links`.
For one combined payload covering route selection and build availability, use `GET /admin/dashboard-readiness` or `npm run dashboard:status`.
For one combined payload covering summary, runtime, health, and readiness, use `GET /admin/dashboard-overview` or `npm run dashboard:overview`.

For an AI-generated redesign/prototype workflow, see [`docs/emergent-dashboard-prompt.md`](./docs/emergent-dashboard-prompt.md).

## Runtime Status
Use `GET /admin/runtime` or `npm run check:env` to inspect requested provider, active provider, and whether Supabase credentials are present.
For Supabase schema/environment setup, see [`docs/supabase-setup.md`](./docs/supabase-setup.md).

## Next Planned Milestones
- Day 4: OpenAI voice enhancements + stronger sentiment adaptation.
- Day 5: Follow-up personalization and multilingual templates.
- Day 6: Deployment hardening, observability, and CI checks.
- Day 7: Demo recording and final documentation polish.

## Calendar Integration
Scheduling supports two modes:
- `mock_calendar` (default): writes appointment records locally.
- `google_calendar`: set `GOOGLE_CALENDAR_ID` and `GOOGLE_ACCESS_TOKEN` in `.env`.

See daily logs in [`docs/progress/`](docs/progress).
