"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/approvals", label: "Approvals" },
  { href: "/conversations", label: "Conversations" },
  { href: "/content", label: "Content" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)]">
      <div className="px-5 py-5">
        <Image src="/orbit-logo.png" alt="Orbit" width={612} height={408} className="h-7 w-auto" />
        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">Growth Command Center</p>
      </div>

      <nav className="flex-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 block rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-[var(--accent-soft)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] px-2 py-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
