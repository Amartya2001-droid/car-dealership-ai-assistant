# Deployment Checklist

- Run `npm test` and confirm the full suite passes.
- Run `npm run check:production` and resolve every `missingProduction` entry before a real pilot.
- Set `NODE_ENV=production`.
- Set `BASE_URL` to the public HTTPS backend URL.
- Configure `OPENAI_API_KEY` if using non-mock assistant replies.
- Set `USE_MOCK_AI=false` before a real customer-facing pilot.
- Set `STORAGE_PROVIDER=supabase` and configure Supabase tables/credentials.
- Configure Twilio voice webhook to `POST /webhooks/twilio/voice`.
- Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
- Set `GOOGLE_CALENDAR_ID` and `GOOGLE_ACCESS_TOKEN` if enabling calendar sync.
- Verify `GET /health` and `GET /admin/summary` on the deployed URL.
- Run `DEPLOYMENT_URL=https://your-public-url npm run verify:production-url`.
- Run one simulated call and confirm lead persistence.
- Run one real or sandbox Twilio call before recording the final demo.

## Pilot Gate

Treat the system as pilot-ready only when:

- `npm test` passes locally or in CI.
- `npm run check:production` returns `"productionReady": true`.
- `npm run dashboard:status` returns `"ready": true`.
- `npm run verify:production-url` passes against the deployed HTTPS URL.
- A real Twilio call creates a lead visible in `/admin/leads` and `/dashboard`.
