# Orbit — Growth Command Center

An AI marketing command center for OnSight: Trend Agent researches real current
travel news via live web search (Delhi/Bangalore-scoped, grounded in the
knowledge base), Content Agent drafts an adapted variant per connected platform
(X/Threads/LinkedIn), everything lands in an approval queue, and a three-tier
risk policy decides what the AI can do on its own versus what needs your
sign-off. Runs itself every morning at 6am IST via cron, or on demand. Approved
posts and replies publish for real once you've connected Buffer and/or X (see
below); Instagram isn't built.

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
| `GROQ_API_KEY` | Powers the three agents. Without it, agent runs still complete but every item fails safe to the flagged/`NEVER` risk tier (see Settings page). |
| `DASHBOARD_PASSWORD` | Shared password gating the whole app — change this before sharing the URL with anyone |
| `SESSION_SECRET` | Signs the session cookie — use a long random string before deploying anywhere real |
| `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | OAuth 1.0a user-context credentials for posting to X directly. Optional if Buffer's X channel is connected. See below. |
| `BUFFER_API_KEY` | Personal Buffer API key. See below. |
| `BUFFER_X_CHANNEL_ID`, `BUFFER_THREADS_CHANNEL_ID`, `BUFFER_LINKEDIN_CHANNEL_ID` | Per-platform Buffer channel ids — find them with `npm run buffer:channels`. A platform only gets drafted for if its channel id is set. Buffer takes priority over direct X per-platform. |
| `CRON_SECRET` | Random string Vercel sends as `Authorization: Bearer <this>` when it fires the daily cron job. Only matters on Vercel, but set here too so local `curl` tests of the cron route work. |
| `BLOB_READ_WRITE_TOKEN` | Powers LinkedIn image uploads via Vercel Blob. Auto-injected once you add Blob storage from the Vercel dashboard's Storage tab. |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | From an Inngest account (app.inngest.com) — runs the agent cycle pipeline as durable background jobs instead of inline in the request. Locally, `npx inngest-cli@latest dev` works without these. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | From an Upstash Redis database (upstash.com) — backs rate limiting and short-TTL caching. |

## Connecting Buffer (recommended — covers X, Threads, LinkedIn, and real scheduling)

Buffer's API is free on every plan (including free), and it's the only path here with
actual scheduling — approving something can queue it for later instead of posting
immediately. It's also the only way LinkedIn/Threads publishing works at all, since
there's no direct LinkedIn/Threads integration in this app.

1. In Buffer, connect the channel(s) you want to publish to (X, Threads, LinkedIn) — this happens in Buffer's own dashboard, not this app.
2. Create a personal API key: profile icon → **API** (or [publish.buffer.com/settings/api](https://publish.buffer.com/settings/api)) → **Personal Access** tab → **+ New Key**. Give it all permissions and a 1-year expiry (keys aren't permanent like X's OAuth token — you'll need to regenerate this annually).
3. Put it in `.env.local` as `BUFFER_API_KEY`.
4. Run `npm run buffer:channels` — this lists your connected channels and their IDs. Copy each one you want into the matching `BUFFER_X_CHANNEL_ID` / `BUFFER_THREADS_CHANNEL_ID` / `BUFFER_LINKEDIN_CHANNEL_ID`. Only set the ones you've actually connected — Content Agent only drafts for platforms with a channel id present.
5. Restart `npm run dev`. Settings shows per-platform connection status.

**Limitations to know about:**
- Buffer schedules standalone posts to a channel's queue — it does not post in-thread replies to a specific post. `REPLY`-type approvals published via Buffer go out as regular posts with the drafted text, not as an actual @-reply under the original.
- LinkedIn image attachments must be a **publicly reachable, non-expiring URL** — Buffer fetches the image at actual publish time (which can be hours later for a scheduled post), so a signed/expiring URL fails silently. That's why LinkedIn image uploads go through Vercel Blob (see Deploying) rather than any temporary storage.

## Connecting X (Twitter) directly (optional, only used when Buffer isn't connected)

1. Apply for a developer account at [developer.x.com](https://developer.x.com) and create a Project + App.
2. In the app's **User authentication settings**, enable OAuth 1.0a and set App permissions to **Read and Write** (posting fails with a 403 under Read-only).
3. Generate/regenerate: **API Key & Secret** and **Access Token & Secret** (must be regenerated *after* switching to Read and Write, or they'll carry the old read-only scope).
4. Drop all four into `.env.local` as `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`.
5. Restart `npm run dev`.

X moved to **prepaid-credits-only** pay-per-use pricing in Feb 2026 — posting costs ~$0.015/post (~$0.20 if it contains a link), reading costs ~$0.005/post and ~$0.01/user. There's no postpaid "card on file" option and no free tier — buy a credit balance in the X Developer Portal before this will work, and set a per-cycle spending cap while you're there. Unlike Buffer, direct X posting is always immediate — there's no scheduling on this path.

**What's live vs. simulated right now:** approving a `POST` or `REPLY` publishes for real once Buffer *or* X is connected (Buffer wins if both are). Nothing auto-posts — every item sits in the queue until you explicitly approve it. Real @-replies to real mentions aren't possible yet regardless of provider: the seeded mentions Community Agent drafts against are mock data with no real tweet behind them. Making that real means building live mention-polling from the X API (a separate, costlier feature — see "How it works" below).

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
   Environment Variables: `GROQ_API_KEY`, `DASHBOARD_PASSWORD` (pick a
   real one — not `changeme`), `SESSION_SECRET` (a long random string — e.g.
   `openssl rand -hex 32`), `CRON_SECRET` (another random string — Vercel
   needs this to authorize its own daily trigger), `BUFFER_API_KEY` plus
   whichever `BUFFER_*_CHANNEL_ID` variables you've connected, and the four
   `X_*` variables if you've connected X directly. Paste raw values only —
   no surrounding quote marks, unlike `.env.local`.
5. **Add Blob storage** from the Storage tab (needed for LinkedIn image
   uploads) — auto-injects `BLOB_READ_WRITE_TOKEN`. Skip if not using LinkedIn yet.
6. **Generate the first Postgres migration.** This has to happen once, from
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
7. **Deploy.** Vercel picks up the `vercel-build` script automatically
   (`prisma generate && prisma migrate deploy && next build`), so every future
   push applies any new migrations before building. First deploy will be
   triggered by the push in step 6, or you can trigger one manually from the
   Vercel dashboard. The daily cron job (defined in `vercel.json`) registers
   automatically on deploy — no separate setup.
8. Once it's live, seed the knowledge base (`npm run kb:seed`) and optionally
   the demo mock data (`npm run db:seed`) against the real database — same
   local `.env.local` pointed at the real DB. Or skip both and let a live
   agent cycle populate real trends/drafts from scratch.

Share the Vercel URL and the `DASHBOARD_PASSWORD` with your teammate — that's
the whole "login system" for now.

## How it works

- **Runs itself daily, or on demand.** A Vercel cron job hits `/api/cron/agent-cycle`
  at 6am IST (and 3 other fixed slots), gated by a `CRON_SECRET` bearer check
  (fails closed if the secret is ever unset). That route and **Settings → Run
  agent cycle** both just enqueue one `agent/cycle.requested` event per account
  via Inngest (`lib/inngest/client.ts`) — the actual cycle runs as a durable
  background function (`lib/inngest/functions/agent-cycle.ts`), isolated per
  account with its own retries, instead of inline in the request.
- **Trend discovery is live, not a fixed batch.** Each cycle, `lib/agents/discover-trends.ts`
  does a real web-search research pass (Anthropic's native `web_search` tool,
  scoped to Delhi/Bangalore and OnSight's content pillars) and extracts up to 3
  new trend candidates, which then flow through the same keyword-filtered
  pipeline as any manually-seeded trend. This replaced an earlier version that
  ran on a fixed seed batch and silently found "nothing new" once it was
  exhausted.
- **One trend, one draft per connected platform.** Content Agent drafts an
  X/Threads/LinkedIn variant per trend for whichever platforms have a Buffer
  channel configured, each respecting that platform's own character limit
  (280/500/3000). Falls back to X-only direct posting if Buffer isn't
  configured for anything.
- **Risk tiers.** Every mention/trend passes through a keyword pre-filter plus
  the model's own self-assessment (`lib/agents/risk-tiers.ts`). The two
  signals always escalate to the more conservative tier, and any classification
  failure defaults to `NEVER` — never to something more permissive. Fabricated
  numbers/unverified claims (user counts, bookings, partnerships) are treated
  the same as unverified safety claims — always `NEVER`.
- **Knowledge base grounds everything.** Settings → Knowledge base holds the
  brand voice, content pillars, safety rules, and product status that shape
  both trend research and drafting — editable there without a redeploy.
- **Mock data stands in for X mentions.** `lib/db/seed-data/` holds seeded
  mentions for Community Agent (replies) — there's no live mentions feed yet,
  so replies stay simulated regardless of publishing connection. `npm run
  db:seed` reloads them (clears and re-seeds, so use it for demo state, not on
  real data).

## Project structure

See `prisma/schema.prisma` for the data model and `lib/agents/` for the agents:
`discover-trends.ts` (live web search), `trend-agent.ts`, `content-agent.ts`
(multi-platform drafting), `community-agent.ts` (replies), plus the shared
LLM client (`llm-client.ts`) and risk-tier gate (`risk-tiers.ts`).
Publishing lives in `lib/publishing/` (`buffer-client.ts`, `x-client.ts`).
