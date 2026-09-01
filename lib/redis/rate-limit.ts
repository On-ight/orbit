import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";

// One sliding-window limiter per route class, keyed differently depending on
// whether the route sits behind session auth (accountId) or not (IP).
export const authSessionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "ratelimit:auth-session",
});

export const xCallbackLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "ratelimit:x-callback",
});

export const agentsRunLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "300 s"),
  prefix: "ratelimit:agents-run",
});

export const billingLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:billing",
});

export const approvalsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  prefix: "ratelimit:approvals",
});

export const defaultCrudLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:crud",
});
