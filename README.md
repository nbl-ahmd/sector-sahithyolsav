# Sector Sahityolsav App

Standalone Next.js app for Sector Sahityolsav with the Family-domain frame feature:

- Admin dashboard for template/frame management
- Manual per-unit count adjustments for past/missed events
- Unit-specific Family frame links for users
- Global incrementing counter on each framed photo
- Sector leaderboard and share options
- No baked-in default frame; users see only admin-uploaded frames

## Production persistence

This app now supports production-grade persistence:

- **Vercel Blob** for uploaded frame image files (admin uploads)
- **Neon Postgres** for templates, counters, framing records, and leaderboard data

If `DATABASE_URL` is not set, the app falls back to local `data/store.json` storage for development.

## Run locally

```bash
cd sector-sahityolsav-app
npm install
npm run dev
```

Open `http://localhost:3000`.

Family section route: `/family`
User flow route: `/family/frame/<template-id>?unit=<unit-name>`

## Environment variables

Copy `.env.example` to `.env.local` and set real values:

```bash
cp .env.example .env.local

DATABASE_URL=postgres://USER:PASSWORD@HOST/DB_NAME?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
ADMIN_USERNAME=sKarassery
ADMIN_PASSWORD=krysector
ADMIN_AUTH_SECRET=replace_with_long_random_secret
```

## Admin access

- Admin entry is hidden from public user navigation.
- Access admin manually by opening `/admin`.
- Unauthenticated requests are redirected to `/admin/login`.
- Login is protected with an `httpOnly` signed session cookie.

## Neon setup (new database + tables)

1. Create a new Neon project/branch/database from Neon Console.
2. Copy the connection string and set it as `DATABASE_URL`.
3. Run SQL from `database/schema.sql` in Neon SQL Editor.

The app also auto-creates tables on first DB access, but running `database/schema.sql` is recommended for explicit production setup.

## Blob upload flow

Admin frame uploads now use `POST /api/admin/blob` and store files in Vercel Blob.
Returned Blob URLs are saved inside the template `frames` records in Postgres.

Upload safeguards:

- Max 20 files per request
- Max 10MB per file
- Allowed formats: PNG, JPG/JPEG, WEBP

## Health check endpoint

Use `GET /api/health` for uptime/infra checks.

It reports:

- App status (`ok` or `degraded`)
- DB mode (`postgres` or `file` fallback)
- DB connectivity result
- Blob token availability
- Response time

## Deploy as separate app

Deploy `sector-sahityolsav-app` as its own project (for example in Vercel, set Root Directory to this folder).
