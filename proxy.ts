import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/cookie";

// The site is mostly a public marketing site (landing page + SEO pages) with
// a gated app underneath — so this is a blocklist (protect the known app
// routes), not an allowlist. An allowlist means every new marketing page
// added later would silently 404-redirect for crawlers/visitors until
// someone remembered to list it here; a blocklist means new marketing pages
// just work.
const PROTECTED_PAGE_PREFIXES = ["/dashboard", "/approvals", "/content", "/conversations", "/settings", "/onboarding"];
// API routes default to protected (the safer default for API surface) except
// these explicit exceptions, which carry no session cookie by design.
const PUBLIC_API_PREFIXES = ["/api/auth/session", "/api/cron", "/api/webhooks"];

// Cheap gate only — checks the session cookie is *present*, not that it's
// valid. Firebase Admin's auth module doesn't bundle inside Next's proxy
// pipeline (see lib/auth/cookie.ts), so real verification (signature +
// live revocation check) happens downstream in lib/auth/current-user.ts,
// which every protected page/route already calls. A forged or expired
// cookie passes this gate but is rejected there — one extra render, not a
// security hole.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(png|jpg|jpeg|svg|ico|webp|gif)$/.test(pathname);

  if (isStaticAsset) return NextResponse.next();

  const isProtected =
    PROTECTED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    (pathname.startsWith("/api") && !PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix)));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
