import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <Image
        src="/mascot/orbit-mascot-confused.png"
        alt=""
        aria-hidden
        width={220}
        height={220}
        className="h-44 w-44 object-contain"
        priority
      />
      <h1 className="mt-6 text-2xl font-semibold text-neutral-900">Lost in orbit.</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-600">
        This page doesn&apos;t exist, or it moved somewhere we didn&apos;t draft a post about.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        style={{ background: "linear-gradient(120deg, #6229CE, #8E42FC 55%, #BC69EB)" }}
      >
        Back home
      </Link>
    </main>
  );
}
