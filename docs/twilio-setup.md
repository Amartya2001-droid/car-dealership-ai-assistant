# Twilio Setup

## Required Values
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## Voice Webhook
- Configure the phone number voice webhook to `POST /webhooks/twilio/voice`.

## Recommended Test
- Place one sandbox call after deployment and confirm the lead appears in `/admin/leads`.
