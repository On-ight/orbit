// Central link graph for the marketing site's nav + footer — every page
// listed here should exist as a real route. Kept as data (not scattered
// across Navbar/Footer JSX) so the two components can't silently drift out
// of sync with each other.
export const PLATFORM_LINKS = [
  { href: "/x-marketing", label: "X Marketing" },
  { href: "/threads-marketing", label: "Threads Marketing" },
  { href: "/linkedin-marketing", label: "LinkedIn Marketing" },
];

export const PRODUCT_LINKS = [
  { href: "/ai-marketing-agent", label: "AI Marketing Agent" },
  { href: "/social-media-content-generator", label: "AI Content Generator" },
];

export const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];
