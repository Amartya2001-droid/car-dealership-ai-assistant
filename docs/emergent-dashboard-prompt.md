# Emergent Prompt

Use this exact prompt in Emergent:

```text
Build a polished, production-style monitoring dashboard frontend for an after-hours AI assistant used by a car dealership.

Important constraints:
- Connect this project to the existing GitHub repository: https://github.com/Amartya2001-droid/car-dealership-ai-assistant
- The frontend should complement the existing backend instead of replacing it.
- Assume the backend already exists and exposes JSON API endpoints.
- The UI should be responsive and work well on desktop and mobile.
- The design should feel premium, warm, and dealership-oriented rather than generic SaaS.
- Avoid purple-heavy palettes and avoid default bland dashboard styling.

Product context:
- This app monitors an AI assistant that handles after-hours dealership calls.
- Staff need to review leads, callback preferences, follow-ups, appointments, urgency, and runtime status.
- The dashboard is for dealership staff and managers, not customers.

Existing backend endpoints to use:
- GET /dashboard
- GET /health
- GET /admin/runtime
- GET /admin/summary
- GET /admin/leads
- GET /admin/appointments
- GET /admin/followups

Core screens and sections:
1. Main operations dashboard
- Hero/header with dealership branding and a live status summary.
- KPI cards for:
  - total leads
  - callbacks requested
  - appointments
  - queued follow-ups
- Lead monitoring section with:
  - search input
  - topic filter
  - status filter
  - recent lead cards
  - callback preference badges
  - showroom brochure/walkaround links when available
- Appointments section with clear status badges.
- Follow-up queue section.
- Runtime status section showing:
  - app version
  - storage provider
  - storage mode
  - default persona
- Attention queue for urgent or callback-sensitive leads.
- Quick links panel for JSON/admin endpoints.

2. Design direction
- Use a premium automotive operations look:
  - warm neutrals
  - muted forest/bronze/rust accents
  - strong typography
  - soft card surfaces
  - subtle gradients or texture
- The interface should feel deliberate and high-end, not template-like.
- Use tasteful motion for loading and section reveal.

3. Data behavior
- Fetch live data from the backend endpoints listed above.
- Show loading, empty, and error states cleanly.
- Refresh data automatically every 30 seconds.
- Also include a manual refresh button.
- Keep the implementation simple and reliable.

4. Technical implementation
- Build the frontend in a way that can live inside the existing repository.
- Prefer a structure that can be exported or committed back into the repo cleanly.
- Do not rebuild the backend.
- Do not add fake authentication unless absolutely necessary.
- Use real API wiring with graceful fallback states.

5. Output quality
- Produce code and structure that is clean enough for follow-up editing by a developer.
- Keep naming clear and implementation maintainable.
- Add concise comments only where needed.

Goal:
Create a frontend that feels like a real operations dashboard for a dealership AI call assistant, and make it easy to connect or commit back to the existing GitHub repo.
```

## Notes

- If Emergent asks whether to create a new backend, say no.
- If Emergent asks about the stack, tell it to work with the existing backend and generate only the frontend/dashboard layer.
- If Emergent exports code, we can then pull it into this repo and I can clean it up, integrate it, and make any code-level changes without you needing to micromanage it.
