import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (action !== "ignore") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { approvals: { where: { status: "PENDING" } } },
  });
  if (!conversation || conversation.accountId !== currentUser.accountId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.conversation.update({ where: { id }, data: { status: "IGNORED" } }),
    ...conversation.approvals.map((approval) =>
      prisma.approval.update({
        where: { id: approval.id },
        data: { status: "REJECTED", resolvedAt: new Date() },
      }),
    ),
  ]);

  const updated = await prisma.conversation.findUnique({ where: { id } });
  return NextResponse.json(updated);
}
