import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AccountMenu } from "@/components/marketing/AccountMenu";

export async function Navbar() {
  const currentUser = await getCurrentUser();

  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center">
          <Image src="/orbit-logo.png" alt="Orbit AI" width={612} height={408} priority className="h-9 w-auto" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/pricing" className="hidden text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:inline">
            Pricing
          </Link>
          <Link href="/blog" className="hidden text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:inline">
            Blog
          </Link>
          {currentUser ? (
            <AccountMenu name={currentUser.account.name} />
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
