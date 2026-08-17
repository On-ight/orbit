# Orbit — Growth Command Center

A v1 AI marketing command center for X: the Trend, Content, and Community agents
prepare drafts against seeded mock mentions, everything lands in an approval
queue, and a three-tier risk policy decides what the AI can do on its own
versus what needs your sign-off. Approved original posts can publish live to X
once you've connected credentials (see below); replies and Threads/Instagram
are still simulated/not built.

## Setup

The app runs on Postgres (Neon) — there's no SQLite fallback anymore, so you need
a database before `npm run dev` will work. See **Deploying** below for the
easiest way to get one (Vercel's Neon integration), even if you're only running
locally for now — the free tier works fine for that.

```bash
npm install
# set DATABASE_URL and DATABASE_URL_UNPOOLED in .env.local first — see below
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

A `.env.local` with placeholder values is already in place — fill in the blanks
before running anything. See the table below for what each variable does.

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login`.

### Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string |
| `DATABASE_URL_UNPOOLED` | Direct Postgres connection string, used only for running migrations |
| `OPENAI_API_KEY` | Powers the three agents (`gpt-5.6-luna` by default — cheap, swap the `LLM_MODEL` constant in `lib/agents/llm-client.ts` for higher quality). Without it, agent runs still complete but every item fails safe to the flagged/`NEVER` risk tier (see Settings page). |
| `DASHBOARD_PASSWORD` | Shared password gating the whole app — change this before sharing the URL with anyone |
| `SESSION_SECRET` | Signs the session cookie — use a long random string before deploying anywhere real |
| `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | OAuth 1.0a user-context credentials for posting to X. Without these, approved posts stay simulated. See below for how to get them. |

## Connecting X (Twitter) for live posting

1. Apply for a developer account at [developer.x.com](https://developer.x.com) and create a Project + App.
2. In the app's **User authentication settings**, enable OAuth 1.0a and set App permissions to **Read and Write** (posting fails with a 403 under Read-only).
3. Generate/regenerate: **API Key & Secret** and **Access Token & Secret** (must be regenerated *after* switching to Read and Write, or they'll carry the old read-only scope).
4. Drop all four into `.env.local` as `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`.
5. Restart `npm run dev`. Settings will show "X (Twitter): connected."

X moved to pay-per-use pricing in Feb 2026 — posting costs ~$0.015/post (~$0.20 if it contains a link), billed to whatever payment method is on the developer account. There's no free tier anymore, but also no monthly minimum.

**What's live vs. simulated right now:** approving a `POST`-type item in the queue publishes it for real once X is connected. `REPLY`-type approvals stay simulated regardless — the seeded mentions they respond to are mock data with no real tweet behind them, so there's nothing genuine to reply to yet. Making replies go live is a separate follow-up: it means replacing the mock mentions feed with a real one from the X API (which also means read costs), so a real tweet ID exists to attach the reply to. Threads publishing isn't built yet.

## Deploying (Vercel + Neon Postgres)

For sharing this with a teammate — one shared `DASHBOARD_PASSWORD`, no
per-user accounts yet.

1. **Push this repo to GitHub.** (If you're reading this after I set up git
   locally, see the note at the bottom of this section for the exact push
   command.)
2. **Import the repo into Vercel** (vercel.com → Add New → Project → pick the
   repo).
3. **Add Postgres** from the Vercel project's **Storage** tab → Neon →
   Create. This auto-populates `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (plus
   some legacy `POSTGRES_*` variables you can ignore) into the project's
   environment variables for you.
4. **Add the rest of the environment variables** in Project Settings →
   Environment Variables: `OPENAI_API_KEY`, `DASHBOARD_PASSWORD` (pick a
   real one — not `changeme`), `SESSION_SECRET` (a long random string — e.g.
   `openssl rand -hex 32`), and the four `X_*` variables if you've connected X.
   Paste raw values only — no surrounding quote marks, unlike `.env.local`.
5. **Generate the first Postgres migration.** This has to happen once, from
   your machine, against the real database — I can't do it without your DB
   credentials, and Vercel's build step only *applies* migrations, it
   doesn't generate new ones. Copy `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
   from step 3 into your local `.env.local`, then run:
   ```bash
   npx prisma migrate dev --name init
   git add prisma/migrations
   git commit -m "Add initial Postgres migration"
   git push
   ```
6. **Deploy.** Vercel picks up the `vercel-build` script automatically
   (`prisma generate && prisma migrate deploy && next build`), so every future
   push applies any new migrations before building. First deploy will be
   triggered by the push in step 5, or you can trigger one manually from the
   Vercel dashboard.
7. Once it's live, run the seed script once against the real database (same
   local `.env.local` pointed at the real DB): `npm run db:seed` — or skip
   this and let the Trend/Community agents populate real data from a live
   agent cycle instead, once you've connected X.

Share the Vercel URL and the `DASHBOARD_PASSWORD` with your teammate — that's
the whole "login system" for now.

## How it works

- **No live polling.** There's nothing to poll without X API credentials, so
  agent runs are triggered manually from **Settings → Run agent cycle**. The
  orchestration logic (`lib/agents/run-cycle.ts`) has no dependency on
  Request/Response, so swapping in a real scheduler later doesn't require
  touching agent code.
- **Risk tiers.** Every mention/trend passes through a keyword pre-filter plus
  the model's own self-assessment (`lib/agents/risk-tiers.ts`). The two
  signals always escalate to the more conservative tier, and any classification
  failure defaults to `NEVER` — never to something more permissive.
- **Mock data stands in for the X API.** `lib/db/seed-data/` holds the seeded
  mentions and trend signals; `npm run db:seed` reloads them (this clears and
  re-seeds the database, so use it for a fresh demo state, not on real data).

## Project structure

See `prisma/schema.prisma` for the data model and `lib/agents/` for the three
agents (`content-agent.ts`, `community-agent.ts`, `trend-agent.ts`) plus the
shared LLM client (`llm-client.ts`, OpenAI-backed) and risk-tier gate.
