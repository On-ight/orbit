// Blog post index — used by the blog listing page. Each entry's slug must
// match a real app/(marketing)/blog/<slug>/page.tsx route (and be listed in
// app/sitemap.ts) or it's a dead link.
export const BLOG_POSTS = [
  {
    slug: "ai-marketing-agent-vs-social-media-management-tools",
    title: "AI Marketing Agents vs. Social Media Management Tools",
    description:
      "A scheduler still needs you to write the post. Here's the actual difference between social media management tools and an AI marketing agent — and when each one is the right fit.",
    date: "2026-08-25",
  },
  {
    slug: "how-to-build-a-social-media-content-calendar-with-ai",
    title: "How to Build a Social Media Content Calendar with AI",
    description:
      "Most AI-built content calendars fail the same way: they're generic on day one. Here's a workflow that keeps an AI-assisted calendar grounded in what's actually happening in your business.",
    date: "2026-08-25",
  },
  {
    slug: "turn-one-idea-into-content-for-x-threads-and-linkedin",
    title: "How to Turn One Idea Into Content for X, Threads, and LinkedIn",
    description:
      "Posting the same text on three platforms is why it underperforms on all three. Here's how to take one update and adapt it properly for X, Threads, and LinkedIn.",
    date: "2026-08-25",
  },
] as const;
