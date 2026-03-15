# Supabase Setup

## Required Environment
- `STORAGE_PROVIDER=supabase`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Current State
- The app still writes to local JSON files.
- Runtime helpers now report whether Supabase credentials are present and whether the app is in local fallback mode.

## Recommended Next Step
- Install the Supabase client and move lead, follow-up, and appointment writes behind a provider adapter.
