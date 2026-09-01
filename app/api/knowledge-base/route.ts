import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { defaultCrudLimiter } from "@/lib/redis/rate-limit";

export const POST = withAuth(async (request, { user: currentUser }) => {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const entry = await prisma.knowledgeBaseEntry.create({
    data: { accountId: currentUser.accountId, title, content },
  });
  return NextResponse.json(entry);
}, { rateLimit: defaultCrudLimiter });
