import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // deleteMany with an accountId filter, not delete-by-id-alone, so this is a
  // no-op rather than a cross-tenant delete if the id belongs to someone else.
  await prisma.knowledgeBaseEntry.deleteMany({ where: { id, accountId: currentUser.accountId } });
  return NextResponse.json({ ok: true });
}
