import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { defaultCrudLimiter } from "@/lib/redis/rate-limit";
import { listHeygenAvatars } from "@/lib/reels/heygen-client";

// Backs the avatar picker on the Reel-generation flow — lists the account's
// own HeyGen digital twins live, plus HeyGen's premade stock presenters as
// an alternative, so there's always something to pick even before any
// digital twin has been created.
export const GET = withAuth(
  async () => {
    try {
      const avatars = await listHeygenAvatars();
      return NextResponse.json({ avatars });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  },
  { rateLimit: defaultCrudLimiter },
);
