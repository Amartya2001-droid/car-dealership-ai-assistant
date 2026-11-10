# Northstar Auto deployment requirements

## Current status and architecture

No shared public production URL is verified. The README's Codespaces flow is a personal development demo, not a live production deployment. A Sites project binding in `.openai/hosting.json` does not establish that a deployment is live or publicly accessible.

The web app is React served by Node/Express with a SQLite database (`app-core/local-store.mjs`). An alternative Cloudflare Worker uses D1. Java belongs to the Capacitor Android client; there is no Java web service to deploy. Android is optional for the web launch.

## Node deployment

1. Choose a Node/container host with HTTPS, a domain, and a persistent writable disk. Use Node **22.22+**. Run one replica when using SQLite; do not place the database on ephemeral container storage or share it between replicas.
2. Build from a reviewed commit. `npm ci`, `npm test`, `npm run demo:setup`, `npm run build:site`, and `node scripts/demo-smoke.mjs` reproduce App checks. Demo setup creates an isolated sample database and prints local credentials; it is not production provisioning.
3. The supplied multi-stage `Dockerfile` builds the React frontend and starts `node index.js` on port 3000. Build with `docker build -t northstar .`. Mount a persistent volume at `/app/data`, writable by the container's `node` user. Set `DATA_DIR=/app/data`; the unified app saves `northstar.sqlite` there. Verify the Docker build on the chosen platform before rollout.
4. Configure server environment through the host's secret/settings interface:

   | Variable | Requirement |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `PORT` | Host's internal port (default 3000) |
   | `DATA_DIR` | Persistent writable directory |
   | `BASE_URL` | Actual public HTTPS origin |
   | `ALLOWED_ORIGINS` | Actual allowed browser origins, including the app origin |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Owner-supplied staff login; generate a strong unique password privately |
   | `ADMIN_API_KEY` | Separate server-only key protecting legacy administrative endpoints |

   Keep all credentials out of git and `REACT_APP_*`. The new workspace uses authenticated staff sessions; do not follow the legacy example's suggestion to bake an admin key into browser JavaScript. Do not copy placeholder provider values from `.env.production.example`. Supabase settings affect the legacy JSON subsystem, not the unified app's SQLite database.
5. Set real dealership details, support/privacy contact, currency, time zone and booking hours in Staff settings. Replace labeled demo listings with verified inventory and licensed photos. Check the demo setting and privacy notice before accepting customer data.
6. Configure backups and test a restore. Use SQLite-aware backups (or stop the app for a consistent copy); copying only the main SQLite file during active WAL writes can lose data. Back up legacy JSON data too if those endpoints are used. Configure health monitoring, error alerts, log retention, and a customer-data retention policy.

## Worker/D1 alternative

Build the frontend, then run `npm run build:site` to create `dist/`. Sites needs a verified project, a D1 binding named `DB`, schema/migrations, and runtime secrets for staff authentication and any providers. Drizzle configuration and `.openai/migrations/` describe the hosted schema. Apply/review migrations and test backups before traffic. Do not assume local SQLite data automatically transfers to D1.

Confirm the site's access policy and actual URL. An owner-only preview requires ChatGPT login and is unsuitable as a public Android backend. This task documents deployment; it does not authorize or perform a public launch.

## Optional integrations and Android

- Guided inventory answers work without provider keys. Live AI requires an owner-supplied `OPENAI_API_KEY` and optional `OPENAI_MODEL`; test provider failure/fallback behavior.
- Phone intake requires a real Twilio account/number, `TWILIO_AUTH_TOKEN`, and `VOICE_WEBHOOK_URL` matching the exact public `https://<host>/api/webhooks/twilio/voice` POST endpoint. Verify signatures and retry deduplication with the real account. Do not claim live phone support until tested. The new workspace does not automatically send confirmation email/SMS or sync calendars.
- Android builds require Java 21, Android SDK 36, a public HTTPS `APP_BACKEND_URL`, `npm run android:prepare`, and Gradle. Release needs Amartya's upload key, Play account/store and policy information, and physical-device validation. Never embed staff/provider secrets or a Sites bypass token in an APK.

## Launch acceptance and owner decisions

Amartya must choose the host/domain and access policy, supply production secrets through the host, verify business/inventory/photo rights and privacy/retention details, and arrange backups/monitoring. Providers and Android distribution are separate optional decisions.

Before marking live, check HTTPS and `/health`, then exercise the actual public app: inventory → inquiry/test drive → staff sign-in → status/note/appointment update → shopper tracking → delete sample request. Verify Insights at 7/30/90 days, authentication boundaries, CSV export, restart persistence, and backup restore. Check browser errors and provider fallback. Record actual test counts and workflow URLs, then update README with the verified live URL and limitations. Until these checks pass, report **not live yet — blocked by production hosting/configuration and launch verification**.
