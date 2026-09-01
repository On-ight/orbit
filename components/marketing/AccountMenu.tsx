"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
      >
        {name}
        <svg
          viewBox="0 0 12 8"
          className={`h-2.5 w-2.5 fill-none stroke-current stroke-[1.5] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1.5L6 6.5L11 1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
