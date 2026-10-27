# Orbit — Growth Command Center

An AI marketing command center for OnSight: Trend Agent researches real current
travel news via live web search (Delhi/Bangalore-scoped, grounded in the
knowledge base), Content Agent drafts an adapted variant per connected platform
(X/Threads/LinkedIn), everything lands in an approval queue, and a three-tier
risk policy decides what the AI can do on its own versus what needs your
sign-off. Runs itself every morning at 6am IST via cron, or on demand. Approved
posts and replies publish for real once you've connected X, Threads, and/or
LinkedIn directly (see below). AI-avatar Reels and photo Carousels (see
Reels/Carousels in the app) publish straight to Instagram directly via
Meta's own API too. Every platform publishes directly through its own API —
there's no third-party scheduling service in the loop anywhere.

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
| `GROQ_API_KEY_2` | Optional. A second Groq account/org's key — if the primary key hits a `RateLimitError` (its own daily/per-minute quota, shared across every Groq call in the app), `lib/agents/llm-client.ts` automatically retries the identical request against this key instead of failing. Not a higher limit on the same key; a genuinely separate account. |
| `DASHBOARD_PASSWORD` | Shared password gating the whole app — change this before sharing the URL with anyone |
| `SESSION_SECRET` | Signs the session cookie — use a long random string before deploying anywhere real |
| `X_CLIENT_ID`, `X_CLIENT_SECRET` | OAuth 2.0 + PKCE app credentials from the X Developer Portal — powers the per-account "Connect X" button in Settings, used for both reading mentions and publishing directly (one connection, not two). See below. |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | From a LinkedIn Developer App — powers direct LinkedIn publishing to your own profile. See below. |
| `CRON_SECRET` | Random string Vercel sends as `Authorization: Bearer <this>` when it fires the daily cron job. Only matters on Vercel, but set here too so local `curl` tests of the cron route work. |
| `BLOB_READ_WRITE_TOKEN` | Powers the image attachment upload on LinkedIn approval cards (`/api/upload`) — direct LinkedIn publishing fetches the image's bytes from this Blob URL and re-uploads them to LinkedIn's own Images API at publish time. Auto-injected once you add Blob storage from the Vercel dashboard's Storage tab. |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | From an Inngest account (app.inngest.com) — runs the agent cycle pipeline as durable background jobs instead of inline in the request. Locally, `npx inngest-cli@latest dev` works without these. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | From an Upstash Redis database (upstash.com) — backs rate limiting and short-TTL caching. |
| `NEXT_PUBLIC_SITE_URL` | This app's own canonical public URL (e.g. `https://orbitai.co.in`) — already used for OAuth redirect URIs; the HeyGen webhook callback (built inside a background job, with no incoming request to derive a host from) reuses this same convention rather than a separate variable. Falls back to `http://localhost:3000` if unset. |
| `HEYGEN_API_KEY` | From a HeyGen account (heygen.com) — generates the AI-avatar Reel videos (avatar, voice, and captions all in one call). Also backs the avatar picker on the Reel-generation flow, which lists the account's own digital-twin avatars live via `GET /v3/avatars/looks`, plus HeyGen's premade stock presenters as a fallback/alternative — so there's always something to pick even before you've cloned your own avatar. Note HeyGen bills API usage through its own separate wallet, not your Studio plan's credits — top that up separately in HeyGen's account settings under Usage, or video generation fails with an "insufficient credits" error even if your Studio dashboard shows credits remaining. |
| `HEYGEN_WEBHOOK_SECRET` | Random string appended to the webhook callback URL as `?secret=` — HeyGen calls this route with no session, so this is the payload-authenticity check. |
| `UNSPLASH_ACCESS_KEY` | Free Unsplash developer app access key (unsplash.com/developers) — backs Carousel slide background photos. Optional: without it, Carousels still render, just with the plain gradient look instead of a photo per slide. Demo apps are capped at 50 requests/hour. |
| `RESEND_API_KEY` | From a free Resend account (resend.com) — sends the "agent run completed/failed" email after each cycle. Optional: without it, runs still complete normally, the email step is just a silent no-op. |
| `RESEND_FROM_EMAIL` | Optional. The verified sender address once you've verified your own domain in Resend (e.g. `Orbit <notifications@orbitai.co.in>`). Without it, falls back to Resend's shared test sender (`onboarding@resend.dev`), which only delivers to the Resend account's own owner — fine for trying this out, not for real users. |
| `ADMIN_NOTIFICATION_EMAIL` | Optional. Your own address — gets a "New Orbit signup" email every time someone creates an account, via `lib/notifications/email.ts`'s `sendNewSignupEmail`. Silently a no-op without it (or without `RESEND_API_KEY`). |
| `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | From a Meta Developer App's Instagram product (Instagram API with Instagram Login) — powers direct Instagram publishing for Reels/Carousels. See below. |
| `THREADS_APP_ID`, `THREADS_APP_SECRET` | From the same Meta Developer App's Threads product — a separate credential pair from Instagram's even though it's one app; Threads' endpoints reject the Instagram pair outright. Powers direct Threads publishing. See below. |

## Connecting X (Twitter) directly

X publishes (and reads mentions) through one per-account OAuth connection —
there's no separate "direct publish" credential anymore. The same
"Connect X" button and token power both.

1. Apply for a developer account at [developer.x.com](https://developer.x.com) and create a Project + App.
2. In the app's **User authentication settings**, enable **OAuth 2.0** and set **App permissions** to **Read and Write** (posting fails with a 403 under Read-only). Type of App: **Web App**.
3. Add `https://<your-domain>/api/connections/x/callback` as a callback/redirect URI.
4. Copy the **Client ID**/**Client Secret** into `.env.local` as `X_CLIENT_ID` / `X_CLIENT_SECRET`.
5. Restart `npm run dev`, go to Settings, click **Connect X**.

X moved to **prepaid-credits-only** pay-per-use pricing in Feb 2026 — posting costs ~$0.015/post (~$0.20 if it contains a link), reading costs ~$0.005/post and ~$0.01/user. There's no postpaid "card on file" option and no free tier — buy a credit balance in the X Developer Portal before this will work, and set a per-cycle spending cap while you're there. Direct X posting is always immediate — there's no scheduling on this path. `REPLY`-type approvals post as genuine in-thread @-replies (not standalone posts) since the real tweet being replied to is already on hand from mention discovery.

## Connecting LinkedIn directly

LinkedIn posts (`POST` approvals for the LinkedIn platform) publish straight
to your own profile via LinkedIn's REST API, through a real per-account OAuth
connect button in Settings.

1. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/apps) and add two self-serve products to it: **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn**. Both grant immediately — no App Review needed to post to your own profile.
2. In the app's **Auth** tab, add `https://<your-domain>/api/connections/linkedin/callback` as an authorized redirect URL.
3. Copy the **Client ID**/**Client Secret** into `.env.local` as `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`.
4. Restart `npm run dev`, go to Settings, click **Connect LinkedIn**.

**Real limitation, not a bug:** LinkedIn only issues a programmatic *refresh*
token to approved Marketing Developer Platform partners — not available on
this self-serve setup. The access token lasts 60 days with no way to
silently renew it; once it expires, Settings shows LinkedIn as "Not
connected" again and you just click **Connect LinkedIn** (really
Reconnect) once more. There's nothing to monitor for this — it fails safe,
the same as never having connected.

An optional image attachment on a LinkedIn approval card uploads through
LinkedIn's own Images API (fetch the bytes from Vercel Blob, then re-upload
them to LinkedIn — LinkedIn's Posts API won't accept an arbitrary external
URL directly).

**What's live vs. simulated right now:** approving a `POST` publishes for
real once that platform is connected (X, Threads, Instagram, and LinkedIn
all publish directly). Approving a
`REPLY` posts a genuine in-thread @-reply once X is connected —
`discoverMentions()` (`lib/agents/discover-mentions.ts`) pulls real mentions
and keyword matches via that same connection, not mock data. Nothing
auto-posts — every item sits in the queue until you explicitly approve it.

## Connecting Instagram directly (for Reels/Carousels)

Reels/Carousels publish straight to Meta's own Content Publishing API, via
a real per-account OAuth connect button in Settings.

1. Create a Meta Developer App at [developers.facebook.com](https://developers.facebook.com/apps) (type: **Business**).
2. Add the **Instagram** product, using **Instagram API with Instagram Login** (not Facebook Login) — this works directly against a Business/Creator Instagram account, no linked Facebook Page needed.
3. In the Instagram product's settings, add `https://<your-domain>/api/connections/instagram/callback` as a valid OAuth redirect URI, and note the **Instagram App ID**/**Instagram App Secret**.
4. Put those in `.env.local` as `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET`.
5. **To publish to your own account, you don't need App Review or Business Verification** — just add that Instagram account as an **Instagram Tester** in the app dashboard (while the app is in Development mode) and accept the invite from Instagram's own Settings → Apps and Websites → Tester Invites. App Review + Business Verification (a real multi-week process) is only required once *other people's* accounts need to connect, not for your own.
6. Restart `npm run dev`, go to Settings, click **Connect Instagram**.

Publishing itself is async (Meta's own container-processing step can take a
couple minutes), handled by the `instagram-publish` Inngest function — same
pattern as the HeyGen Reel-render pipeline. **If you add this function
after Inngest was already synced once, you need to manually re-sync** (Inngest
dashboard → Apps → your app → Sync) or events for it will be silently
dropped — this bit Reels earlier for the exact same reason.

Reels/Carousels can also be **scheduled** for a future time instead of
publishing right away — a "Schedule for" picker shown on Instagram items
once connected. Under the hood this is a durable `step.sleepUntil` inside
the Inngest function, not a separate cron — it costs nothing while waiting,
even for a schedule days out.

Every agent cycle also pulls **per-post Instagram insights** (likes,
comments, reach, saves) for Reels/Carousels published in the last 30 days,
via `lib/agents/instagram-insights-agent.ts`. This needs the
`instagram_business_manage_insights` scope, which is now part of the
connect flow's `SCOPE` string — **if you connected Instagram before this
scope was added, click Reconnect in Settings once**, since OAuth only
grants what was asked for at consent time, not retroactively. Once at least
3 posts have measured engagement, a short auto-generated performance
summary gets written into the account's knowledge base (so future Reel/
Carousel drafts actually lean into what's performed well — no separate
mechanism, it rides the same `buildSystemPrompt()` every agent already
uses) and surfaced on the new **Marketing tips** page alongside general,
always-shown best-practice advice.

## Connecting Threads directly

Same deal as Instagram — Threads posts (`POST` approvals for the Threads
platform) publish straight to Meta's Threads API via their own OAuth connect
button.

1. In the **same** Meta Developer App as Instagram, add the **Threads** product.
2. Add `https://<your-domain>/api/connections/threads/callback` as a valid OAuth redirect URI, and note the **Threads App ID**/**Threads App Secret** — this is a separate credential pair from the Instagram one even though it's the same app; Threads' endpoints reject the Instagram pair.
3. Put those in `.env.local` as `THREADS_APP_ID` / `THREADS_APP_SECRET`.
4. Same Instagram Tester-style exemption applies — publishing to your own account needs no App Review/Business Verification, just adding that account as a tester and accepting the invite.
5. Restart `npm run dev`, go to Settings, click **Connect Threads**.

Publishing here is simpler than Instagram's (text-only, no carousel/video
processing) — Meta's own guidance is just a ~30s wait after creating the
post container before publishing it — but it still runs through the
`threads-publish` Inngest function for one consistent "Meta platform
publish" model rather than a one-off synchronous path. Same Inngest-resync
caveat as Instagram applies the first time this function is added.

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
   needs this to authorize its own daily trigger), and whichever of the
   `X_*`, `INSTAGRAM_*`, `THREADS_*`, `LINKEDIN_*` variable pairs you've
   connected directly. Paste raw values only — no surrounding quote marks,
   unlike `.env.local`.
5. **Add Blob storage** from the Storage tab (needed for image attachments
   on LinkedIn approval cards) — auto-injects `BLOB_READ_WRITE_TOKEN`. Skip
   if not using LinkedIn yet.
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
  X/Threads/LinkedIn variant per trend for whichever of those three this
  account has both connected directly and the account's plan tier allows
  (`PlanLimits.textPlatforms` — Free only allows Threads), each respecting
  that platform's own character limit (280/500/3000).
- **Risk tiers.** Every mention/trend passes through a keyword pre-filter plus
  the model's own self-assessment (`lib/agents/risk-tiers.ts`). The two
  signals always escalate to the more conservative tier, and any classification
  failure defaults to `NEVER` — never to something more permissive. Fabricated
  numbers/unverified claims (user counts, bookings, partnerships) are treated
  the same as unverified safety claims — always `NEVER`.
- **Knowledge base grounds everything.** Settings → Knowledge base holds the
  brand voice, content pillars, safety rules, and product status that shape
  both trend research and drafting — editable there without a redeploy.
- **Run completions notify you two ways.** `lib/notifications/email.ts` emails
  every user on the account (subject + the same summary line shown in
  Settings → Recent runs) once a cycle finishes — a silent no-op if
  `RESEND_API_KEY` isn't set. Separately, `components/dashboard/RunNotifier.tsx`
  polls `/api/runs/latest` every 20s from the browser and pops a dismissible
  toast top-right the moment a new run completes — there's no websocket/SSE
  infra behind this, it's short-interval polling, "real-time" in the
  practical sense of a dashboard tab left open, not a true push.
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
Publishing lives in `lib/publishing/` (`x-client.ts`, `threads-client.ts`,
`linkedin-client.ts`, `instagram-client.ts`) — one direct-API client per
platform, no third-party scheduler in between.
