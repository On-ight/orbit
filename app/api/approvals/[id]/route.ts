import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isXConfigured, publishPostToX } from "@/lib/publishing/x-client";
import { isBufferConfigured, schedulePostToBuffer } from "@/lib/publishing/buffer-client";

type Action = "approve" | "reject" | "edit";

interface LivePublishResult {
  publishedVia: "BUFFER" | "X";
  platformPostId: string;
  publishedUrl: string | null;
  scheduledFor: Date | null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;
  const editedContent = typeof body?.editedContent === "string" ? body.editedContent : undefined;
  const scheduledForInput = typeof body?.scheduledFor === "string" ? new Date(body.scheduledFor) : undefined;

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
    // Publishing priority: Buffer first (handles POST and REPLY alike, plus
    // real scheduling), then direct X (POST only, always immediate — X's
    // basic post endpoint has no scheduling of its own), then simulated.
    // If the live call fails, nothing is marked approved so the item stays
    // in the queue and can be retried.
    let livePublish: LivePublishResult | null = null;

    if (isBufferConfigured()) {
      try {
        const result = await schedulePostToBuffer(finalContent, scheduledForInput);
        livePublish = {
          publishedVia: "BUFFER",
          platformPostId: result.bufferPostId,
          publishedUrl: null,
          scheduledFor: scheduledForInput ?? null,
        };
      } catch (err) {
        return NextResponse.json(
          { error: `Failed to schedule via Buffer: ${String(err)}` },
          { status: 502 },
        );
      }
    } else if (approval.type === "POST" && approval.postId && isXConfigured()) {
      try {
        const result = await publishPostToX(finalContent);
        livePublish = {
          publishedVia: "X",
          platformPostId: result.platformPostId,
          publishedUrl: result.url,
          scheduledFor: null,
        };
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
        publishedVia: livePublish?.publishedVia,
        platformPostId: livePublish?.platformPostId,
        publishedUrl: livePublish?.publishedUrl,
        scheduledFor: livePublish?.scheduledFor,
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
          status: livePublish?.scheduledFor ? "SCHEDULED" : "PUBLISHED",
          publishedAt: livePublish?.scheduledFor ? null : new Date(),
          scheduledFor: livePublish?.scheduledFor,
          simulated: !livePublish,
          publishedVia: livePublish?.publishedVia,
          content: finalContent,
          platformPostId: livePublish?.platformPostId,
          publishedUrl: livePublish?.publishedUrl,
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
