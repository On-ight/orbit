import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/cookie";

// Cheap gate only — checks the session cookie is *present*, not that it's
// valid. Firebase Admin's auth module doesn't bundle inside Next's proxy
// pipeline (see lib/auth/cookie.ts), so real verification (signature +
// live revocation check) happens downstream in lib/auth/current-user.ts,
// which every protected page/route already calls. A forged or expired
// cookie passes this gate but is rejected there — one extra render, not a
// security hole.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/auth/session") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    // Static assets referenced from public pages (e.g. the logo on the
    // landing page) — images/icons carry no sensitive data, safe to serve
    // regardless of auth state.
    /\.(png|jpg|jpeg|svg|ico|webp|gif)$/.test(pathname);

  if (isPublic) return NextResponse.next();

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
