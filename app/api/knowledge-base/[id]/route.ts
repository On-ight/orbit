import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { defaultCrudLimiter } from "@/lib/redis/rate-limit";

export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(async (_request, { params, user: currentUser }) => {
  const { id } = await params;
  // deleteMany with an accountId filter, not delete-by-id-alone, so this is a
  // no-op rather than a cross-tenant delete if the id belongs to someone else.
  await prisma.knowledgeBaseEntry.deleteMany({ where: { id, accountId: currentUser.accountId } });
  return NextResponse.json({ ok: true });
}, { rateLimit: defaultCrudLimiter });
