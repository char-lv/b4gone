import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// Placeholder for the signed-in home until the dashboard (#9) lists upcoming deadlines.
export default function DashboardPage() {
  return (
    <>
      <h1 className="text-[1.625rem] font-[650] leading-tight tracking-[-0.015em]">Dashboard</h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">
        Upcoming return deadlines, warranty expirations, and renewals for the next 30 days.
      </p>

      <section className="mt-8 rounded-card border border-line bg-surface px-6 py-14 text-center shadow-card">
        <span className="mx-auto mb-4 inline-grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
        </span>
        <h2 className="text-[1.0625rem] font-[650]">Nothing to track yet</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[0.9375rem] text-muted">
          Your account is ready. Items and subscriptions you add will show their upcoming deadlines here.
        </p>
      </section>
    </>
  );
}
