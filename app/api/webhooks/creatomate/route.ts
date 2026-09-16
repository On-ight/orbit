import { NextRequest, NextResponse } from "next/server";
import { inngest, CREATOMATE_RENDER_COMPLETED } from "@/lib/inngest/client";

// Public route (proxy.ts already exempts /api/webhooks from the session-
// cookie gate) — Creatomate calls this directly, no session involved. A
// shared secret is the payload-authenticity check that exemption doesn't
// provide on its own, same fail-closed pattern as CRON_SECRET.
export async function POST(request: NextRequest) {
  const secret = process.env.CREATOMATE_WEBHOOK_SECRET;
  const providedSecret = request.nextUrl.searchParams.get("secret");

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  // `metadata` is the reelId we passed when submitting the render
  // (lib/reels/creatomate-client.ts) — Creatomate echoes it back verbatim.
  const reelId = typeof body?.metadata === "string" ? body.metadata : null;
  const status = typeof body?.status === "string" ? body.status : null;
  const url = typeof body?.url === "string" ? body.url : null;

  if (!reelId || !status) {
    return NextResponse.json({ error: "Missing metadata/status in webhook payload" }, { status: 400 });
  }

  await inngest.send({
    name: CREATOMATE_RENDER_COMPLETED,
    data: { reelId, status, url },
  });

  return NextResponse.json({ ok: true });
}
