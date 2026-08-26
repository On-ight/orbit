// Determines which billing track (INR/domestic vs USD/international) a
// request belongs to, via Vercel's edge-injected geo header. Trustworthy in
// production: Vercel's edge overwrites any client-supplied
// x-vercel-ip-country with the real geo-IP result before the request
// reaches app code, so it can't be spoofed by a visitor. Absent entirely in
// local dev (no Vercel edge in front of `next dev`) — falls back to USD
// there, with an optional dev-only override for local testing.
export type BillingCurrency = "USD" | "INR";

export function resolveBillingCurrency(headers: Headers, devCountryOverride?: string | null): BillingCurrency {
  if (process.env.NODE_ENV !== "production" && devCountryOverride) {
    return devCountryOverride.toUpperCase() === "IN" ? "INR" : "USD";
  }
  return headers.get("x-vercel-ip-country") === "IN" ? "INR" : "USD";
}
