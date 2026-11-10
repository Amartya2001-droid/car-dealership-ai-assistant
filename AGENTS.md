# Agent working rules

1. Work on a branch. Open a pull request for every change. Never push directly to main (or this repository's default branch, `master`).
2. Tests must pass before a PR is opened. If the repo has no tests, add a smoke test for what you changed.
3. Never commit secrets, API keys or credentials. Never invent credentials, licences or metrics.
4. Keep the README honest: what works, what is live, and the live URL.
5. At the end of the day, create (if it does not exist) the issue **10-day agent program — daily log** and post your report as a comment in this format:

   ```markdown
   ## Day N — <repo>
   Did:
   - <work, with PR/commit link>
   Blocked on: <anything needing Amartya>
   Will do tomorrow:
   - <next step>
   Live status: <URL or "not live yet — blocked by …">
   ```

   Then stop. Do not start new work after the report.

## Day 1 — triage

Get oriented, get CI green, fix what's already open, and set up reporting. No new features on Day 1. Review the Oct 22 staff insights dashboard locally, list broken flows, and open one PR per fix. Record deployment requirements in `DEPLOY.md`.

## Verification

- Node 22.22 or newer is required (the backend uses `node:sqlite`).
- Run the full backend suite with `npm test`; report the actual test count.
- The **App checks** workflow is `.github/workflows/checks.yml`. Its commands are `npm ci`, `npm test`, `npm run demo:setup`, `npm run build:site`, and `node scripts/demo-smoke.mjs`.
- Demo setup creates ignored, random local credentials. Never paste them in reports or commit `.demo/`.
- Use sample data for browser checks; keep customer information and request codes out of reports.
