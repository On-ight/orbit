import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { approvalsLimiter } from "@/lib/redis/rate-limit";
import { BufferPlatform, BufferAsset, isBufferConfiguredForPlatform, schedulePostToBuffer } from "@/lib/publishing/buffer-client";
import { isInstagramConnected } from "@/lib/publishing/instagram-client";
import { isThreadsConnected } from "@/lib/publishing/threads-client";
import { isXConnected, publishPostToX } from "@/lib/publishing/x-client";
import { isLinkedInConnected, publishPostToLinkedIn } from "@/lib/publishing/linkedin-client";
import { inngest, INSTAGRAM_PUBLISH_REQUESTED, THREADS_PUBLISH_REQUESTED } from "@/lib/inngest/client";

type Action = "approve" | "reject" | "edit";

// Instagram, Threads, X, and now LinkedIn all publish directly (lib/publishing/
// instagram-client.ts, threads-client.ts, x-client.ts, linkedin-client.ts) —
// Buffer currently has no platform left to serve. Kept as an empty list
// rather than ripped out: the Buffer code path itself still works fine if a
// platform ever needs to move back onto it, no code change required, just
// adding it back here.
const BUFFER_PLATFORMS: BufferPlatform[] = [];

interface LivePublishResult {
  publishedVia: "BUFFER" | "X" | "LINKEDIN";
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

  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      reel: { select: { videoUrl: true, hashtags: true } },
      carousel: { select: { slideImageUrls: true, hashtags: true } },
      // Only populated for REPLY approvals — the real tweet being replied
      // to, so direct X publishing can post an actual in-thread reply
      // instead of a standalone post (see the X-publish branch below).
      conversation: { select: { sourceMention: { select: { platformPostId: true } } } },
    },
  });
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

    const assets: BufferAsset[] | undefined =
      bufferPlatform === "LINKEDIN" && finalImageUrl ? [{ image: { url: finalImageUrl } }] : undefined;

    if (
      bufferPlatform &&
      (await isBufferConfiguredForPlatform(currentUser.accountId, bufferPlatform))
    ) {
      try {
        const result = await schedulePostToBuffer(currentUser.accountId, finalContent, bufferPlatform, {
          dueAt: scheduledForInput,
          assets,
        });
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

    // X publishes directly via this account's own connected token (the same
    // OAuth2 connection used for reading mentions already requested
    // tweet.write scope) — a single immediate API call, no polling needed,
    // so this stays synchronous like Buffer's path rather than Instagram/
    // Threads' async Inngest jobs. Never a shared/global credential — one
    // tenant can never post through another's connected account.
    if (!livePublish && approval.platform === "X" && (await isXConnected(currentUser.accountId))) {
      try {
        const replyToTweetId =
          approval.type === "REPLY" ? approval.conversation?.sourceMention.platformPostId : undefined;
        const result = await publishPostToX(currentUser.accountId, finalContent, replyToTweetId);
        livePublish = {
          publishedVia: "X",
          platformPostId: result.platformPostId,
          publishedUrl: result.url,
          scheduledFor: null,
        };
      } catch (err) {
        return NextResponse.json({ error: `Failed to publish to X: ${String(err)}` }, { status: 502 });
      }
    }

    // LinkedIn publishes directly too — a single immediate API call like
    // X's, so stays synchronous. finalImageUrl is the same user-attached
    // (never AI-generated) image this route already supported for
    // Buffer's LinkedIn path; publishPostToLinkedIn handles uploading it to
    // LinkedIn's own asset storage when present.
    if (!livePublish && approval.platform === "LINKEDIN" && (await isLinkedInConnected(currentUser.accountId))) {
      try {
        const result = await publishPostToLinkedIn(currentUser.accountId, finalContent, finalImageUrl);
        livePublish = {
          publishedVia: "LINKEDIN",
          platformPostId: result.platformPostId,
          publishedUrl: result.url,
          scheduledFor: null,
        };
      } catch (err) {
        return NextResponse.json({ error: `Failed to publish to LinkedIn: ${String(err)}` }, { status: 502 });
      }
    }

    // Instagram (Reels/Carousels) and Threads both publish directly via
    // Meta's API instead — their container-create-then-publish round-trip
    // can't happen synchronously inside this request (Instagram alone needs
    // up to 5 minutes of polling), so each is an async Inngest job rather
    // than a synchronous call like Buffer's. publishedVia/platformPostId/
    // publishedUrl populate later once that job finishes — asyncDirectPublish
    // marks that this item is in that pending state, not actually published
    // yet, so the Post-update block below doesn't prematurely mark it so.
    let asyncDirectPublish = false;
    if (approval.platform === "INSTAGRAM" && (await isInstagramConnected(currentUser.accountId))) {
      asyncDirectPublish = true;
      await inngest.send({
        name: INSTAGRAM_PUBLISH_REQUESTED,
        data: { accountId: currentUser.accountId, approvalId: id },
      });
    } else if (approval.platform === "THREADS" && (await isThreadsConnected(currentUser.accountId))) {
      asyncDirectPublish = true;
      await inngest.send({
        name: THREADS_PUBLISH_REQUESTED,
        data: { accountId: currentUser.accountId, approvalId: id },
      });
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
    // asyncDirectPublish means the real publish is still pending in Inngest
    // — the linked Post stays untouched here (not marked published, not
    // marked simulated either) and gets updated for real once that job
    // finishes (see lib/inngest/functions/threads-publish.ts).
    if (approval.postId && !asyncDirectPublish) {
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
    } else if (approval.postId && asyncDirectPublish) {
      await prisma.post.update({ where: { id: approval.postId }, data: { content: finalContent } });
    }
    // Just a status flip either way — if Instagram isn't connected, this
    // still marks the Reel/Carousel approved and the caption/hashtags stay
    // ready to grab from the card manually; if it is connected, the Inngest
    // job enqueued above updates publishedVia/platformPostId once it finishes.
    if (approval.reelId) {
      await prisma.reel.update({ where: { id: approval.reelId }, data: { status: "APPROVED" } });
    }
    if (approval.carouselId) {
      await prisma.carousel.update({ where: { id: approval.carouselId }, data: { status: "APPROVED" } });
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
  if (approval.reelId) {
    await prisma.reel.update({ where: { id: approval.reelId }, data: { status: "REJECTED" } });
  }
  if (approval.carouselId) {
    await prisma.carousel.update({ where: { id: approval.carouselId }, data: { status: "REJECTED" } });
  }

  return NextResponse.json(updated);
}, { rateLimit: approvalsLimiter });
