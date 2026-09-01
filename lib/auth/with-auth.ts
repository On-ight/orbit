import { NextRequest, NextResponse } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

function rateLimitResponse(reset: number): NextResponse {
  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

// Vercel/Next 16 no longer expose NextRequest#ip — the platform forwards the
// client's address in this header instead.
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

type RouteContext = Record<string, unknown>;

/**
 * Replaces the `getCurrentUser()` + 401-check pattern duplicated across most
 * API routes. Optionally rate-limits by accountId first (before invoking the
 * handler) when a limiter is supplied. Forwards any route context Next.js
 * passes in (e.g. `{ params }` on dynamic routes) untouched, merged with the
 * resolved user.
 */
export function withAuth<C extends RouteContext = RouteContext>(
  handler: (request: NextRequest, ctx: C & { user: CurrentUser }) => Promise<Response>,
  opts?: { rateLimit?: Ratelimit },
) {
  return async (request: NextRequest, ctx?: C): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (opts?.rateLimit) {
      const { success, reset } = await opts.rateLimit.limit(user.accountId);
      if (!success) return rateLimitResponse(reset);
    }

    return handler(request, { ...(ctx as C), user });
  };
}

/**
 * For the handful of routes with no session cookie at all (auth/session,
 * the X OAuth callback) — rate-limited by IP instead of accountId.
 */
export function withIpRateLimit(rateLimit: Ratelimit, handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const { success, reset } = await rateLimit.limit(getClientIp(request));
    if (!success) return rateLimitResponse(reset);
    return handler(request);
  };
}
