# Sector Sahityolsav App

Standalone Next.js app for Sector Sahityolsav with the Family-domain frame feature:

- Admin dashboard for template/frame management
- Unit-specific Family frame links for users
- Global incrementing counter on each framed photo
- Sector leaderboard and share options
- No baked-in default frame; users see only admin-uploaded frames

## Run locally

```bash
cd sector-sahityolsav-app
npm install
npm run dev
```

Open `http://localhost:3000`.

Family section route: `/family`
User flow route: `/family/frame/<template-id>?unit=<unit-name>`

## Deploy as separate app

Deploy `sector-sahityolsav-app` as its own project (for example in Vercel, set Root Directory to this folder).
