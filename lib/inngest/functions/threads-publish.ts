import { prisma } from "@/lib/db/prisma";
import { inngest, THREADS_PUBLISH_REQUESTED, type ThreadsPublishRequestedData } from "@/lib/inngest/client";
import { getThreadsAuth, createTextContainer, publishThreadsContainer, getThreadsPermalink } from "@/lib/publishing/threads-client";

/**
 * Publishes an already-approved Threads post directly via Meta's Threads
 * API — simpler than Instagram's pipeline (text-only, no carousel/video
 * processing), but kept as the same async-Inngest shape for one consistent
 * "Meta platform publish" model rather than a special-cased synchronous path.
 * Meta's own guidance is to wait ~30s after creating a container before
 * publishing it. Whole body in one try/catch, same reasoning as
 * reel-pipeline.ts/instagram-publish.ts: any failure, including the
 * earliest load step, must still be traceable rather than silently stuck.
 */
export const threadsPublishFn = inngest.createFunction(
  {
    id: "threads-publish",
    concurrency: { limit: 5 },
    retries: 2,
    triggers: [{ event: THREADS_PUBLISH_REQUESTED }],
  },
  async ({ event, step }) => {
    const { accountId, approvalId } = event.data as ThreadsPublishRequestedData;

    try {
      const approval = await step.run("load-approval", () =>
        prisma.approval.findUnique({ where: { id: approvalId } }),
      );
      if (!approval) throw new Error(`Approval ${approvalId} not found`);

      const auth = await getThreadsAuth(accountId);
      if (!auth) throw new Error(`Account ${accountId} has no Threads connection`);

      const text = approval.editedContent ?? approval.content;

      const containerId = await step.run("create-container", () => createTextContainer(auth, text));
      await step.sleep("wait-processing", "30s");
      const postId = await step.run("publish", () => publishThreadsContainer(auth, containerId));
      const permalink = await step.run("get-permalink", () => getThreadsPermalink(auth, postId));

      await step.run("record-published", async () => {
        await prisma.approval.update({
          where: { id: approvalId },
          data: { publishedVia: "THREADS", platformPostId: postId, publishedUrl: permalink },
        });
        // Mirrors what the synchronous Buffer path does inline in
        // app/api/approvals/[id]/route.ts for the other platforms — the
        // approve request deliberately left this untouched (asyncDirectPublish)
        // since the real publish was still pending at that point.
        if (approval.postId) {
          await prisma.post.update({
            where: { id: approval.postId },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
              simulated: false,
              publishedVia: "THREADS",
              platformPostId: postId,
              publishedUrl: permalink,
            },
          });
        }
      });

      return { approvalId, status: "PUBLISHED" as const, postId };
    } catch (err) {
      console.error(`Threads publish failed for approval ${approvalId}:`, err);
      throw err;
    }
  },
);
