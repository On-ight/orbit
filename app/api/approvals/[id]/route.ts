import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isXConfigured, publishPostToX } from "@/lib/publishing/x-client";

type Action = "approve" | "reject" | "edit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;
  const editedContent = typeof body?.editedContent === "string" ? body.editedContent : undefined;

  if (!action || !["approve", "reject", "edit"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const approval = await prisma.approval.findUnique({ where: { id } });
  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "edit") {
    if (editedContent === undefined) {
      return NextResponse.json({ error: "editedContent is required for edit" }, { status: 400 });
    }
    const updated = await prisma.approval.update({
      where: { id },
      data: { editedContent, status: "EDITED" },
    });
    return NextResponse.json(updated);
  }

  const finalContent = editedContent ?? approval.editedContent ?? approval.content;

  if (action === "approve") {
    // Original posts go out for real when X credentials are configured.
    // Replies stay simulated for now — mock mentions have no real tweet ID
    // to reply to yet. If the live publish fails, nothing is marked approved
    // so the item stays in the queue and can be retried.
    let livePublish: { platformPostId: string; url: string } | null = null;
    if (approval.type === "POST" && approval.postId && isXConfigured()) {
      try {
        livePublish = await publishPostToX(finalContent);
      } catch (err) {
        return NextResponse.json(
          { error: `Failed to publish to X: ${String(err)}` },
          { status: 502 },
        );
      }
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: "APPROVED",
        editedContent: editedContent ?? approval.editedContent,
        resolvedAt: new Date(),
      },
    });

    if (approval.conversationId) {
      await prisma.conversation.update({
        where: { id: approval.conversationId },
        data: { status: "REPLIED" },
      });
    }
    if (approval.postId) {
      await prisma.post.update({
        where: { id: approval.postId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          simulated: !livePublish,
          content: finalContent,
          platformPostId: livePublish?.platformPostId,
          publishedUrl: livePublish?.url,
        },
      });
    }

    return NextResponse.json(updated);
  }

  // reject
  const updated = await prisma.approval.update({
    where: { id },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });

  if (approval.conversationId) {
    await prisma.conversation.update({
      where: { id: approval.conversationId },
      data: { status: "IGNORED" },
    });
  }

  return NextResponse.json(updated);
}
