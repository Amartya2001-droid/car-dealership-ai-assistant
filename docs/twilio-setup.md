# Twilio Setup

## Required Values
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## Voice Webhook
- Configure the phone number voice webhook to `POST /webhooks/twilio/voice`.
- Use the full deployed HTTPS URL, for example:
  - `https://your-public-backend.example.com/webhooks/twilio/voice`
- Twilio should use `HTTP POST`.

## Recommended Test
- Run `DEPLOYMENT_URL=https://your-public-backend.example.com npm run verify:production-url`.
- Place one sandbox call after deployment and confirm the lead appears in `/admin/leads`.
- Confirm the dashboard summary updates at `/dashboard` or `/ops-dashboard/`.
