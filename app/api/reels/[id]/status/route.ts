import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { defaultCrudLimiter } from "@/lib/redis/rate-limit";

export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (_request, { params, user: currentUser }) => {
    const { id } = await params;
    const reel = await prisma.reel.findUnique({
      where: { id },
      select: { id: true, accountId: true, status: true, videoUrl: true },
    });
    if (!reel || reel.accountId !== currentUser.accountId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ status: reel.status, videoUrl: reel.videoUrl });
  },
  { rateLimit: defaultCrudLimiter },
);
