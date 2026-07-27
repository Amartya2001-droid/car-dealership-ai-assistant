# Supabase Setup

## Required Environment
- `STORAGE_PROVIDER=supabase`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_LEADS_TABLE` (default: `assistant_leads`)
- `SUPABASE_FOLLOWUPS_TABLE` (default: `assistant_followups`)
- `SUPABASE_APPOINTMENTS_TABLE` (default: `assistant_appointments`)

## Table Schema (SQL)
Run this in Supabase SQL editor:

```sql
create table if not exists assistant_leads (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant_followups (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant_appointments (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Runtime Behavior
- The app now uses a DB-first persistence adapter for leads, follow-ups, and appointments.
- If Supabase is unreachable or not configured, it automatically falls back to local JSON files.
- Inspect active mode with:
  - `GET /admin/runtime`
  - `npm run check:env`

## Production Gate

Before using Supabase for a real dealership pilot:

- Set `STORAGE_PROVIDER=supabase`.
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Run `npm run check:production` and confirm:
  - `"storage.activeProvider": "supabase"`
  - `"storage.mode": "remote_ready"`
  - `"productionReady": true`
- Run one `POST /simulate/call` against the deployed app.
- Confirm the new lead appears in Supabase and in `GET /admin/leads`.
