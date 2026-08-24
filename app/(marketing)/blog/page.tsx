import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/marketing/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guides on AI-assisted social media marketing — from Orbit AI's actual product workflow, not generic AI-generated filler.",
};

export default function BlogIndexPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Blog</h1>
      <p className="mt-4 text-lg text-neutral-600">
        Practical guides on AI-assisted social media marketing, written from what we've actually learned
        building Orbit AI.
      </p>

      <div className="mt-14 divide-y divide-neutral-200">
        {BLOG_POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block py-8 first:pt-0">
            <p className="text-sm text-neutral-500">{post.date}</p>
            <h2 className="mt-1 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-neutral-600">{post.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
