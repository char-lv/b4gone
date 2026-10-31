import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { getCurrentUser } from "@/lib/auth/server-session";

const TOPICS = [
  {
    title: "Return deadlines",
    text: "Record the last day to send something back, and see it coming instead of finding the receipt a week late.",
    icon: "M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4",
  },
  {
    title: "Warranty expirations",
    text: "Keep warranty end dates next to each purchase so a repair claim never slips past its window.",
    icon: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z",
  },
  {
    title: "Subscription renewals",
    text: "See the next charge for every monthly or yearly plan, plus what they add up to each month.",
    icon: "M5 8h14v11H5zM5 8l2-4h10l2 4M9 13h6",
  },
] as const;

const primaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-control border border-accent bg-accent px-5 font-semibold text-white shadow-control transition-colors hover:border-accent-hover hover:bg-accent-hover";
const secondaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-control border border-line-button bg-surface px-5 font-semibold text-ink shadow-control transition-colors hover:bg-surface-hover";

export default async function HomePage() {
  // The landing page must load even if the session cannot be checked; visitors then see sign-in links.
  const user = await getCurrentUser().catch(() => null);

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <Wordmark href="/" />
          <nav aria-label="Account" className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="rounded-control px-3 py-2 text-[0.9375rem] font-semibold text-ink hover:text-accent">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="rounded-control px-3 py-2 text-[0.9375rem] font-semibold text-ink hover:text-accent">
                  Sign in
                </Link>
                <Link href="/register" className={`${primaryLink} min-h-9 px-3.5 text-[0.9375rem]`}>
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-5 pb-20 pt-14 sm:pt-20">
        <section className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
            Returns · Warranties · Renewals
          </p>
          <h1 className="text-[2.25rem] font-[680] leading-[1.15] tracking-[-0.02em] sm:text-5xl">
            Keep track of deadlines before they&apos;re gone.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            B4Gone keeps your purchases and subscriptions in one private place and shows what needs attention in the
            next 30 days.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link href="/dashboard" className={primaryLink}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className={primaryLink}>
                  Create account
                </Link>
                <Link href="/sign-in" className={secondaryLink}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        <ul className="mt-16 grid gap-4 sm:grid-cols-3">
          {TOPICS.map((topic) => (
            <li key={topic.title} className="rounded-card border border-line bg-surface p-6 shadow-card">
              <span className="mb-4 inline-grid size-10 place-items-center rounded-control bg-accent-soft text-accent">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={topic.icon} />
                </svg>
              </span>
              <h2 className="text-[1.0625rem] font-[650]">{topic.title}</h2>
              <p className="mt-2 text-[0.9375rem] text-muted">{topic.text}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
