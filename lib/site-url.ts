// Canonical site origin — do NOT derive URLs like OAuth callbacks from a
// given request's own host. A visitor can reach the same deployment via
// multiple valid hosts (e.g. www vs apex, a Vercel preview URL), and an
// OAuth redirect_uri must exactly match what's registered with the
// provider; building it from the incoming request means it silently
// drifts depending on which host the visitor happened to land on.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
