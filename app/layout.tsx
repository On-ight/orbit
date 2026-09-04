import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://orbitai.co.in";
const TITLE = "Orbit AI | AI Marketing Agent for X, Threads & LinkedIn";
const DESCRIPTION =
  "Orbit AI is an autonomous AI marketing agent that helps businesses plan, create, and manage social media marketing across X, Threads, and LinkedIn.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Orbit AI",
  },
  description: DESCRIPTION,
  keywords: [
    "AI marketing agent",
    "social media AI agent",
    "X marketing AI",
    "Threads marketing AI",
    "LinkedIn marketing AI",
    "AI social media manager",
    "Orbit AI",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Orbit AI",
    images: ["/orbit-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/orbit-logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Runs before paint so a stored theme choice applies immediately,
            instead of flashing light mode first. suppressHydrationWarning
            above covers the data-theme attribute this sets. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("orbit-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
