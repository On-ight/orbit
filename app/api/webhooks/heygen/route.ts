import { NextRequest, NextResponse } from "next/server";
import { inngest, HEYGEN_VIDEO_COMPLETED } from "@/lib/inngest/client";

// Public route (proxy.ts already exempts /api/webhooks from the session-
// cookie gate) — HeyGen calls this directly, no session involved. A shared
// secret is the payload-authenticity check that exemption doesn't provide
// on its own, same fail-closed pattern as CRON_SECRET.
export async function POST(request: NextRequest) {
  const secret = process.env.HEYGEN_WEBHOOK_SECRET;
  const providedSecret = request.nextUrl.searchParams.get("secret");

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const eventType = typeof body?.event_type === "string" ? body.event_type : null;
  // callback_id is the reelId we passed when submitting the video
  // (lib/reels/heygen-client.ts) — HeyGen echoes it back verbatim.
  const reelId = typeof body?.event_data?.callback_id === "string" ? body.event_data.callback_id : null;
  const videoUrl = typeof body?.event_data?.url === "string" ? body.event_data.url : null;

  if (!reelId || !eventType) {
    return NextResponse.json({ error: "Missing callback_id/event_type in webhook payload" }, { status: 400 });
  }

  await inngest.send({
    name: HEYGEN_VIDEO_COMPLETED,
    data: {
      reelId,
      status: eventType === "avatar_video.success" ? "completed" : "failed",
      videoUrl,
    },
  });

  return NextResponse.json({ ok: true });
}
