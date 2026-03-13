# Troubleshooting

## GitHub Push Issues
- If `git push` fails through the local credential helper, retry with authenticated GitHub CLI token-based push.

## Twilio Call Not Reaching the App
- Confirm the webhook points to `POST /webhooks/twilio/voice`.
- Confirm the deployed app is reachable from the public internet.

## No Inventory Matches Returned
- Check `data/knowledge-base.json` for available vehicles and budget alignment.

## Google Calendar Scheduling Falls Back
- Verify `GOOGLE_CALENDAR_ID` and `GOOGLE_ACCESS_TOKEN`.
