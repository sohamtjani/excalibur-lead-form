# Excalibur Lead Form

Standalone public lead form for Excalibur. Each submission sends a notification email through Resend; it does not write to a database.

## Live behavior

- No login flow
- Public form submission to a private `/api/lead` Vercel function
- Immediate email notification to the configured recipient inbox
- Optional referral attribution through:
  - manual `Referral code` entry
  - `?ref=CODE` or `?code=CODE` URL parameters

## Environment

Create `.env.local` with:

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL="Excalibur Leads <leads@yourdomain.com>"
LEAD_NOTIFICATION_TO=owner@yourdomain.com
```

`RESEND_FROM_EMAIL` must use a domain verified in Resend. Keep these values private: do not prefix them with `VITE_` and do not commit `.env.local`.

## Run locally

```bash
npm install
npm run dev
```

For end-to-end local form testing, run the project with Vercel's local development server instead, which makes `/api/lead` available:

```bash
npx vercel dev
```

## Deployment

Deploy the repository to Vercel and add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `LEAD_NOTIFICATION_TO` in the project environment variables. The function uses Resend only to deliver the notification email and does not store submitted lead data.

## Build

```bash
npm run build
```
