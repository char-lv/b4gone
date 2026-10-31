import Link from "next/link";

/** The B4Gone name with its small hourglass mark, linking to the given page. */
export function Wordmark({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-control text-xl font-bold tracking-[-0.02em] text-ink">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-accent" fill="none">
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="currentColor" />
        <path
          d="M8 6.5h8M8 17.5h8M9 6.5c0 3 6 3.5 6 5.5s-6 2.5-6 5.5M15 6.5c0 3-6 3.5-6 5.5"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      B4Gone
    </Link>
  );
}
