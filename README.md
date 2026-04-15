This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

This project uses Supabase for realtime multiplayer, and the client/server configuration is driven by environment variables.

1. Copy `.env.example` to `.env`.
2. Fill in your Supabase and Google OAuth values.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon public API key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key for server-side room actions
- `SUPABASE_POSTGRES_URL` — PostgreSQL connection string for direct DB reference (optional)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret

> `.env` is ignored by git, so your secrets stay local.

## Supabase Setup

The schema for multiplayer rooms is defined in `supabase.sql`.

If you are using a Supabase project, make sure PostgreSQL extensions like `pgcrypto` are enabled, then execute the SQL schema.

For Google Auth, configure the Google provider in the Supabase dashboard and set the callback URL to your app origin, for example:

- `http://localhost:3000` (development)
- `https://your-production-domain.com` (production)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
