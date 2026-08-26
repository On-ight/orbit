import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await prisma.accountSocialToken.deleteMany({
    where: { accountId: currentUser.accountId, platform: "X" },
  });

  return NextResponse.redirect(new URL("/settings?x_disconnected=1", request.url));
}
