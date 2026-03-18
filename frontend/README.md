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

By default the dashboard runs on `http://localhost:3001` and proxies API calls to the Express backend on `http://localhost:3000`.

## Environment variables

- `PORT`: frontend dev server port. Defaults to `3001`.
- `REACT_APP_BACKEND_URL`: optional direct API base URL. Leave empty for same-origin or dev-proxy calls.
- `REACT_APP_BACKEND_PROXY_TARGET`: proxy target used by the CRA dev server. Defaults to `http://localhost:3000`.

## Scripts

- `npm start`: run the local dashboard dev server
- `npm run build`: build the dashboard bundle
- `npm test`: run frontend tests
