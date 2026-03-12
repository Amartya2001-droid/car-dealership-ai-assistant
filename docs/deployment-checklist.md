# Deployment Checklist

- Configure `OPENAI_API_KEY` if using non-mock assistant replies.
- Configure Twilio voice webhook to `POST /webhooks/twilio/voice`.
- Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
- Set `GOOGLE_CALENDAR_ID` and `GOOGLE_ACCESS_TOKEN` if enabling calendar sync.
- Verify `GET /health` and `GET /admin/summary` on the deployed URL.
- Run one simulated call and confirm lead persistence.
- Run one real or sandbox Twilio call before recording the final demo.
