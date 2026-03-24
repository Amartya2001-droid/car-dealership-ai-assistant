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
- Check `GET /admin/dashboard-readiness` or run `npm run dashboard:status` to see the recommended local dashboard route.
- Check `GET /admin/dashboard-status` to confirm the frontend build is present and to see whether `buildMode` is `react_bundle`, `fallback_shell`, or `missing`.
- Check `GET /admin/dashboard-links` to confirm the expected preview URLs.
- Run `npm run dashboard:refresh` to rebuild the bundle and verify the backend-served route.
- If the React bundle build hangs, `npm run dashboard:refresh` now writes a fallback `frontend/build/index.html` that redirects `/ops-dashboard/` to the built-in `/dashboard` route.
