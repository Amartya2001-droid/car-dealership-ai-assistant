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

## Dashboard Route Looks Broken
- Check `GET /admin/dashboard-status` to confirm the frontend build is present.
- Check `GET /admin/dashboard-links` to confirm the expected preview URLs.
- Run `npm run dashboard:refresh` to rebuild the bundle and verify the backend-served route.
