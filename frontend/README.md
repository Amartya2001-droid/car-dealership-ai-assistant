# Dashboard Frontend

React dashboard for monitoring the after-hours dealership assistant.

## Local development

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the backend from the repo root on `http://localhost:3000`.
4. Start this frontend:
   ```bash
   npm start
   ```

By default the dashboard dev server runs on `http://localhost:3001`.

## Stable local route

The production-style bundle is built to live at `/ops-dashboard` and can be served directly by the Express backend:

```bash
npm run dashboard:build
npm run dev
open http://localhost:3000/ops-dashboard/
```

This is the most reliable local preview path in this repo.

## Environment variables

- `PORT`: frontend dev server port. Defaults to `3001`.
- `REACT_APP_BACKEND_URL`: optional direct API base URL. Defaults to empty and can be set to `http://localhost:3000` for direct API calls.
- `REACT_APP_BACKEND_PROXY_TARGET`: proxy target used by the CRA dev server. Defaults to `http://localhost:3000`.

## Scripts

- `npm start`: run the local dashboard dev server
- `npm run build`: build the dashboard bundle for `/ops-dashboard`
- `npm test`: run frontend tests
