import { prisma } from "@/lib/db/prisma";
import { inngest, INSTAGRAM_PUBLISH_REQUESTED, type InstagramPublishRequestedData } from "@/lib/inngest/client";
import {
  getInstagramAuth,
  createImageContainer,
  createCarouselContainer,
  createReelContainer,
  getContainerStatus,
  publishContainer,
  getMediaPermalink,
  buildInstagramCaption,
} from "@/lib/publishing/instagram-client";

// Meta's own guidance: poll a container's status once a minute, for up to 5
// minutes, before giving up — approximated here with a slightly tighter
// interval since Inngest steps add their own small overhead per check.
const POLL_INTERVAL = "20s";
const MAX_POLLS = 15; // 15 * 20s = 5 minutes

/**
 * Publishes an already-approved Reel/Carousel directly to Instagram via
 * Meta's Content Publishing API — a create-container, poll-until-ready,
 * then publish sequence that can take minutes (unlike Buffer's single
 * immediate mutation), so this has to be async rather than running inside
 * the approve request itself. Whole body in one try/catch (the same bug
 * already fixed in reel-pipeline.ts: a failure anywhere, including the
 * earliest load/validation steps, must still be able to mark the Approval
 * failed rather than leaving it silently stuck).
 */
export const instagramPublishFn = inngest.createFunction(
  {
    id: "instagram-publish",
    concurrency: { limit: 5 },
    retries: 2,
    triggers: [{ event: INSTAGRAM_PUBLISH_REQUESTED }],
  },
  async ({ event, step }) => {
    const { accountId, approvalId } = event.data as InstagramPublishRequestedData;

    try {
      const approval = await step.run("load-approval", () =>
        prisma.approval.findUnique({
          where: { id: approvalId },
          include: {
            reel: { select: { videoUrl: true, hashtags: true } },
            carousel: { select: { slideImageUrls: true, hashtags: true } },
          },
        }),
      );
      if (!approval) throw new Error(`Approval ${approvalId} not found`);

      const auth = await getInstagramAuth(accountId);
      if (!auth) throw new Error(`Account ${accountId} has no Instagram connection`);

      const hashtags = approval.reel?.hashtags ?? approval.carousel?.hashtags ?? null;
      const caption = buildInstagramCaption(approval.content, hashtags);

      let containerId: string;
      if (approval.type === "REEL" && approval.reel?.videoUrl) {
        containerId = await step.run("create-reel-container", () =>
          createReelContainer(auth, approval.reel!.videoUrl!, caption),
        );
      } else if (approval.type === "CAROUSEL" && approval.carousel?.slideImageUrls) {
        const imageUrls = approval.carousel.slideImageUrls as string[];
        const childIds = await step.run("create-carousel-children", () =>
          Promise.all(imageUrls.map((url) => createImageContainer(auth, url, { isCarouselItem: true }))),
        );
        containerId = await step.run("create-carousel-container", () =>
          createCarouselContainer(auth, childIds, caption),
        );
      } else {
        throw new Error(`Approval ${approvalId} (type ${approval.type}) has no publishable asset`);
      }

      let ready = false;
      for (let i = 0; i < MAX_POLLS; i++) {
        const status = await step.run(`check-status-${i}`, () => getContainerStatus(auth, containerId));
        if (status === "FINISHED") {
          ready = true;
          break;
        }
        if (status === "ERROR" || status === "EXPIRED") {
          throw new Error(`Instagram container ${containerId} ended in status ${status}`);
        }
        await step.sleep(`wait-${i}`, POLL_INTERVAL);
      }
      if (!ready) throw new Error(`Instagram container ${containerId} never finished processing within 5 minutes`);

      const mediaId = await step.run("publish", () => publishContainer(auth, containerId));
      const permalink = await step.run("get-permalink", () => getMediaPermalink(auth, mediaId));

      await step.run("record-published", () =>
        prisma.approval.update({
          where: { id: approvalId },
          data: { publishedVia: "INSTAGRAM", platformPostId: mediaId, publishedUrl: permalink },
        }),
      );

      return { approvalId, status: "PUBLISHED" as const, mediaId };
    } catch (err) {
      // Nothing to revert on the Approval itself — it's already marked
      // APPROVED by the route that enqueued this (same as Reel rendering:
      // approving and the content actually going live are decoupled).
      // Leaving publishedVia/platformPostId null is the signal that direct
      // publish didn't happen, same as it never having been attempted.
      console.error(`Instagram publish failed for approval ${approvalId}:`, err);
      throw err;
    }
  },
);
