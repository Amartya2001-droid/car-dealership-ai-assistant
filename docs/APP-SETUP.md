# Northstar web + Android app

This upgrade adds a shared API (`app-core/api.mjs`) used by the React shopper and staff interfaces, the Node server, and a Cloudflare Worker deployment. Local development uses SQLite; Sites hosting uses D1. The upgraded phone intake writes into the same staff lead records on both Node and Sites, with signature verification and retry deduplication. Legacy endpoints are retained for compatibility and remain protected.

## Local development

Use Node 22.22 or newer. Run `npm ci`, then `corepack yarn --cwd frontend install --frozen-lockfile`, `npm run dashboard:build`, and `npm start`. Open http://localhost:3000. For live frontend edits, run the API server and `npm run dashboard:start` in separate terminals.

Set `ADMIN_EMAIL` and a long randomly generated `ADMIN_PASSWORD` in `.env` for staff login. Set a separate `ADMIN_API_KEY` for the legacy API. Never put any secret in a `REACT_APP_*` variable. Sessions expire after eight hours. Changing the configured password does not revoke existing sessions; delete sessions in the database when rotating after a compromise.

The current local `.env` contains a generated owner password. It is excluded from source control. Use it only for the preview and rotate before launch. `npm run seed:app` loads explicitly labeled sample inventory. It never removes existing vehicles.

## Shopper workflows

Browse and filter inventory, save a device-local shortlist, inspect specifications and payment estimates, ask the inventory assistant, submit inquiries or test-drive requests, and track or delete requests with a private code. No shopper account is required. Save the request code: this release does not email it automatically.

## Staff workflows

Sign in, add/edit/hide vehicles, review leads, record notes and lifecycle status, confirm/cancel/complete test drives, export a CSV, and configure dealership contact details and currency. Call or email links open your own communication app. Status changes are visible through the shopper’s request code; this release does not send confirmation notifications automatically.

## Hosting

The `.openai/hosting.json` binds a Sites project and D1 database. Run `npm run build:site` after the frontend build. Drizzle owns hosted schema changes; `npm run db:generate` generates new migrations. Local SQL is kept aligned in `app-core/schema.sql`.

An owner-only Sites preview requires the owner’s ChatGPT login. Android needs a publicly reachable backend with application staff authentication. Do not point a release at an owner-only preview or include a bypass token in an APK. A Node host with a persistent `/app/data` disk can run the supplied Dockerfile. Use HTTPS, configure only your real allowed web origins, and keep backups of the database. Use one Node replica with local SQLite; use D1 for hosted concurrency.

## AI and phone services

Without `OPENAI_API_KEY`, the app labels its assistant as guided and returns deterministic inventory/hours/booking guidance. Set `OPENAI_API_KEY` as a hosted secret and optionally `OPENAI_MODEL` to enable live OpenAI replies. These keys never go to the browser. Provider failures use a labeled guided fallback.

Configure your Twilio number’s incoming-call webhook to `https://YOUR-PUBLIC-HOST/api/webhooks/twilio/voice` using POST. Set `TWILIO_AUTH_TOKEN` and `VOICE_WEBHOOK_URL` as server secrets (the latter must be the exact public webhook URL). The assistant discloses automated processing, transcribes one request, stores it in staff leads, and replies using inventory guidance or live AI. Retries with the same CallSid do not create duplicate leads. This path works on Node and Sites. No calls or SMS have been sent during development; real telephony still requires verification with your Twilio account. Automatic outbound SMS and calendar-provider sync remain legacy capabilities and are not part of the new staff workflow.

## Android

The generated Capacitor Android project targets API 36, minimum API 24. Use Java 21 and Android SDK 36. Set `APP_BACKEND_URL` to your public HTTPS backend, run `npm run android:prepare`, then `cd android && ./gradlew assembleDebug` for installation testing or `./gradlew bundleRelease` for an unsigned release bundle. Release signing is deliberately not tied to a throwaway key. Configure your own Play upload key using the documented environment variables in `android/app/build.gradle`.

## Commercial scope

This is one dealership per deployment with one configured staff owner login. It is not yet a multi-tenant subscription SaaS, and has no billing/subscription or staff invitation system. You can operate a branded deployment for a dealership; choose and implement a pricing/licensing model before selling subscriptions.

Before accepting real customer data: replace sample listings with verified inventory and licensed photos; set a real business name, address, support email and retention policy; review the privacy notice; connect any desired providers; configure backup/restore and monitoring; verify on physical Android devices. Public distribution and Google Play acceptance require owner-supplied account, policy, signing and store information.
