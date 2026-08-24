import Link from "next/link";
import { PLATFORM_LINKS, PRODUCT_LINKS, COMPANY_LINKS } from "./nav-data";

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-neutral-600 hover:text-neutral-900">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
        <LinkColumn title="Platforms" links={PLATFORM_LINKS} />
        <LinkColumn title="Product" links={PRODUCT_LINKS} />
        <LinkColumn title="Company" links={COMPANY_LINKS} />
      </div>
      <div className="border-t border-neutral-200 py-6">
        <p className="mx-auto max-w-6xl px-6 text-sm text-neutral-500">
          © {new Date().getFullYear()} Orbit AI — AI Marketing Agent for X, Threads & LinkedIn.
        </p>
      </div>
    </footer>
  );
}
