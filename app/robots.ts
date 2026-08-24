import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/approvals", "/content", "/conversations", "/settings", "/api"],
    },
    sitemap: "https://orbitai.co.in/sitemap.xml",
  };
}
