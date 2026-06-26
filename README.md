# TrackPepper — Web

React web app sharing the same Supabase backend as the iOS app.

**Repo:** [github.com/mdnew/track-pepper-web](https://github.com/mdnew/track-pepper-web)

## Features

- Sign in / sign up / forgot password / reset password
- Join or create a household with invite codes
- Month calendar with per-day completion indicators
- Day view with color-coded schedule blocks, check-offs, and realtime sync
- Profile & household settings

## Supabase setup

Run migrations in order from [`supabase/migrations/`](supabase/migrations/) in your Supabase SQL Editor.

In **Authentication → URL Configuration**, add:
- `http://localhost:5173`
- `http://localhost:5173/reset-password`

## Run locally

```bash
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm run dev
```

Open http://localhost:5173
