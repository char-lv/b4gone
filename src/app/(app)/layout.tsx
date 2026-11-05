import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { getCurrentUser } from "@/lib/auth/server-session";

// Every page in this group is private (issue #2). The proxy redirects signed-out visitors early; this
// server-side lookup is the real check and also catches tokens whose account no longer exists.
export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5">
          <div className="flex items-center gap-8">
            <div className="py-3.5">
              <Wordmark href="/dashboard" />
            </div>
            <nav aria-label="Main">
              <ul className="flex gap-1">
                <li>
                  <Link
                    href="/dashboard"
                    aria-current="page"
                    className="block border-b-2 border-accent px-3.5 pt-[1.0625rem] pb-4 font-semibold text-ink"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex min-w-0 items-center gap-3 py-2">
            <span className="truncate text-sm text-muted" title={user.email}>
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
        {children}
      </main>
    </>
  );
}
