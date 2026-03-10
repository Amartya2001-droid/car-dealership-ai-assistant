# Car Dealership AI Assistant

AI voice assistant for after-hours dealership calls. It answers inventory/service questions, captures leads, queues next-day follow-up messages, and supports Twilio voice integration.

## Scope Through Day 2 (Completed)
- Express server with Twilio Voice webhook endpoints.
- Conversation logic with mood/topic/urgency detection.
- Voice persona selector (`sales_pro`, `concierge`, `tech_expert`).
- Vehicle matchmaker from caller-described preferences.
- JSON data storage for leads and follow-ups.
- Morning dispatch scheduler for staff digest + customer follow-up SMS.
- Knowledge base snapshot API + website sync script.
- Test-drive scheduling with Google Calendar provider + mock fallback.
- Lead lifecycle status tracking and appointment confirmation endpoints.

## Quick Start (under 5 min)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
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

5. Optional one-command setup:
   ```bash
   bash scripts/setup.sh
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

## API Endpoints
- `GET /health`
- `GET /config/personas`
- `POST /webhooks/twilio/voice`
- `POST /webhooks/twilio/voice/collect`
- `POST /simulate/call`
- `GET /admin/leads`
- `GET /admin/followups`
- `GET /admin/appointments`
- `POST /admin/test-drives/schedule`
- `POST /admin/test-drives/:appointmentId/confirm`
- `POST /admin/run-followups`
- `POST /admin/knowledge/snapshot`

## Data Files
- `data/leads.json`
- `data/followups.json`
- `data/knowledge-base.json`
- `data/appointments.json`

## Next Planned Milestones
- Day 3: Add Supabase/Firestore persistence and dashboard skeleton.
- Day 4: Add OpenAI Realtime voice mode + sentiment tuning.
- Day 5: Add outbound follow-up personalization and multilingual support.
- Day 6: Hardening, deployment pipeline, observability.
- Day 7: End-to-end demo recording with call + follow-up proof.

## Calendar Integration
Scheduling supports two modes:
- `mock_calendar` (default): writes appointment records locally.
- `google_calendar`: set `GOOGLE_CALENDAR_ID` and `GOOGLE_ACCESS_TOKEN` in `.env`.

See daily logs in [`docs/progress/`](docs/progress).
