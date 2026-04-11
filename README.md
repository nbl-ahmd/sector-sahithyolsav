# Sector Sahityolsav App

Standalone Next.js app for Sector Sahityolsav with the Family-domain frame feature:

- Admin dashboard for template/frame management
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

Create `.env.local` in project root:

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST/DB_NAME?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

## Neon setup (new database + tables)

1. Create a new Neon project/branch/database from Neon Console.
2. Copy the connection string and set it as `DATABASE_URL`.
3. Run SQL from `database/schema.sql` in Neon SQL Editor.

The app also auto-creates tables on first DB access, but running `database/schema.sql` is recommended for explicit production setup.

## Blob upload flow

Admin frame uploads now use `POST /api/admin/blob` and store files in Vercel Blob.
Returned Blob URLs are saved inside the template `frames` records in Postgres.

## Deploy as separate app

Deploy `sector-sahityolsav-app` as its own project (for example in Vercel, set Root Directory to this folder).
