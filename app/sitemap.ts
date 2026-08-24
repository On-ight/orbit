import type { MetadataRoute } from "next";

const SITE_URL = "https://orbitai.co.in";

const ROUTES = [
  { path: "", priority: 1 },
  { path: "/ai-marketing-agent", priority: 0.9 },
  { path: "/x-marketing", priority: 0.9 },
  { path: "/threads-marketing", priority: 0.9 },
  { path: "/linkedin-marketing", priority: 0.9 },
  { path: "/instagram-marketing", priority: 0.7 },
  { path: "/social-media-content-generator", priority: 0.8 },
  { path: "/pricing", priority: 0.8 },
  { path: "/about", priority: 0.5 },
  { path: "/blog", priority: 0.6 },
  { path: "/blog/ai-marketing-agent-vs-social-media-management-tools", priority: 0.6 },
  { path: "/blog/how-to-build-a-social-media-content-calendar-with-ai", priority: 0.6 },
  { path: "/blog/turn-one-idea-into-content-for-x-threads-and-linkedin", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.path === "" ? "weekly" : "monthly",
    priority: route.priority,
  }));
}
