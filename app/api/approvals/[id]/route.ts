import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { approvalsLimiter } from "@/lib/redis/rate-limit";
import {
  BufferPlatform,
  isBufferConfiguredForPlatform,
  schedulePostToBuffer,
} from "@/lib/publishing/buffer-client";

type Action = "approve" | "reject" | "edit";

const BUFFER_PLATFORMS: BufferPlatform[] = ["X", "THREADS", "LINKEDIN"];

interface LivePublishResult {
  publishedVia: "BUFFER";
  platformPostId: string;
  publishedUrl: string | null;
  scheduledFor: Date | null;
}

export const PATCH = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user: currentUser }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;
  const editedContent = typeof body?.editedContent === "string" ? body.editedContent : undefined;
  const scheduledForInput = typeof body?.scheduledFor === "string" ? new Date(body.scheduledFor) : undefined;
  const imageUrlInput = typeof body?.imageUrl === "string" ? body.imageUrl : undefined;

  if (!action || !["approve", "reject", "edit"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const approval = await prisma.approval.findUnique({ where: { id } });
  // Not found and "belongs to someone else" both come back as 404 — don't
  // reveal that a given id exists under another tenant's account.
  if (!approval || approval.accountId !== currentUser.accountId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "edit") {
    if (editedContent === undefined && imageUrlInput === undefined) {
      return NextResponse.json(
        { error: "editedContent or imageUrl is required for edit" },
        { status: 400 },
      );
    }
    const updated = await prisma.approval.update({
      where: { id },
      data: {
        ...(editedContent !== undefined ? { editedContent } : {}),
        ...(imageUrlInput !== undefined ? { imageUrl: imageUrlInput } : {}),
        status: "EDITED",
      },
    });
    return NextResponse.json(updated);
  }

  const finalContent = editedContent ?? approval.editedContent ?? approval.content;
  const finalImageUrl = imageUrlInput ?? approval.imageUrl ?? undefined;

  if (action === "approve") {
    // Publishing goes through Buffer only — every tenant publishes exclusively
    // via their own connected AccountBufferChannel, never a global fallback
    // credential, so one tenant can never accidentally post through another's
    // (or Orbit's own) connected account. If the live call fails, nothing is
    // marked approved so the item stays in the queue and can be retried.
    let livePublish: LivePublishResult | null = null;
    const bufferPlatform = BUFFER_PLATFORMS.find((p) => p === approval.platform);

    if (bufferPlatform && (await isBufferConfiguredForPlatform(currentUser.accountId, bufferPlatform))) {
      try {
        const result = await schedulePostToBuffer(
          currentUser.accountId,
          finalContent,
          bufferPlatform,
          scheduledForInput,
          bufferPlatform === "LINKEDIN" ? finalImageUrl : undefined,
        );
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
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: "APPROVED",
        editedContent: editedContent ?? approval.editedContent,
        imageUrl: finalImageUrl,
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
}, { rateLimit: approvalsLimiter });
