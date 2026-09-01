import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { extractLimiter } from "@/lib/redis/rate-limit";
import { extractTextFromUrl, extractBrandInfoFromText } from "@/lib/onboarding/extract-brand-info";

export const POST = withAuth(
  async (request, { user: currentUser }) => {
    const body = await request.json().catch(() => null);
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    try {
      const text = await extractTextFromUrl(url);
      const extracted = await extractBrandInfoFromText(currentUser.account.name, text);
      return NextResponse.json(extracted);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
    }
  },
  { rateLimit: extractLimiter },
);
