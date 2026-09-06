# No Boring Cars

Timed auctions for enthusiast and track cars in Israel.

- **Live:** https://no-boring-cars.vercel.app
- **Repo:** https://github.com/EladLandmanz/no_boring_cars
- **Docs:** [Product](docs/01-product.md) · [Technical](docs/02-technical.md) · [Tests](docs/03-tests.md) · [Scale](docs/04-scale.md) · [Security](docs/05-security.md) · [Presentation](docs/06-presentation.md)

Stack: Next.js 16 (App Router), TypeScript, Tailwind 4, Supabase (Auth, Postgres, Storage), Vercel, optional Resend.

## Run locally

Needs Node.js 20+ and **pnpm**.

```bash
git clone https://github.com/EladLandmanz/no_boring_cars.git
cd no_boring_cars
pnpm install
cp .env.example .env.local
```

Fill `.env.local` (see below). Apply `supabase/migrations/` to your Supabase project in timestamp order (SQL Editor or CLI). Sign up once in the app, then you can run `supabase/seed.sql` for demo lots.

```bash
pnpm dev
```

Open http://localhost:3000.

```bash
pnpm test          # Vitest + Testing Library
pnpm test:e2e      # Playwright (install browsers once: pnpm exec playwright install chromium)
```

Promote an admin in the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

Hobby Vercel cron runs `/api/cron/close-listings` once daily. For frequent ticks locally, send `GET` or `POST` with `Authorization: Bearer <CRON_SECRET>`.

## Environment variables

Copy names from `.env.example`. Never commit real keys.

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Project URL (origin only) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Anon key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Cron, some emails/alerts |
| `CRON_SECRET` | Server only | Bearer token for `/api/cron/close-listings` |
| `NEXT_PUBLIC_SITE_URL` | Server | Canonical origin for email links (e.g. `https://no-boring-cars.vercel.app`) |
| `RESEND_API_KEY` | Server | Optional; skip mail if empty |
| `EMAIL_FROM` | Server | From header |
| `EMAIL_ADMIN_TO` | Server | Review notification inbox |

On Vercel, set the same variables for **Production** (and Preview if you use git preview URLs).
