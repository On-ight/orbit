import { prisma } from "@/lib/db/prisma";
import { requireCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "var(--text-muted)",
  SCHEDULED: "var(--status-warning)",
  PUBLISHED: "var(--status-good)",
};

export default async function ContentPage() {
  const currentUser = await requireCurrentUser();
  const posts = await prisma.post.findMany({
    where: { accountId: currentUser.accountId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Content pipeline</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Posts drafted by the Content Agent, plus anything already in flight. Posts marked
        &ldquo;(simulated)&rdquo; never left this app; everything else went out for real.
      </p>

      <div className="mt-6 space-y-3">
        {posts.length === 0 && (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-muted)]">
            No posts yet.
          </p>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-xs font-medium"
                style={{ color: STATUS_COLOR[post.status] ?? "var(--text-muted)" }}
              >
                {STATUS_LABEL[post.status] ?? post.status}
                {post.status === "PUBLISHED" && post.simulated ? " (simulated)" : ""}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {post.platform} ·{" "}
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleString()
                  : post.scheduledFor
                    ? `scheduled ${new Date(post.scheduledFor).toLocaleString()}`
                    : new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]">{post.content}</p>
            {post.publishedUrl && (
              <a
                href={post.publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
              >
                View live on X →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
