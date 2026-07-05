# Excalibur Lead Form

Standalone public lead form for Excalibur, hosted separately from the affiliate portal but connected to the same Supabase project.

## Live behavior

- No login flow
- Public form submission into `public.leads`
- Optional referral attribution through:
  - manual `Referral code` entry
  - `?ref=CODE` or `?code=CODE` URL parameters

## Environment

Create `.env.local` with:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
