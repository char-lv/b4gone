import Link from "next/link";

/** The B4Gone name with its small hourglass mark, linking to the given page. */
export function Wordmark({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-2 rounded-control text-xl font-bold tracking-[-0.02em] text-ink"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
        <rect width="24" height="24" rx="6" fill="var(--color-accent)" />
        <path d="M7.5 5.5h9M7.5 18.5h9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M8.75 5.5v1.2c0 1.6 1 2.6 2.2 3.6L12 11.2l1.05-.9c1.2-1 2.2-2 2.2-3.6V5.5M8.75 18.5v-1.2c0-1.6 1-2.6 2.2-3.6l1.05-.9 1.05.9c1.2 1 2.2 2 2.2 3.6v1.2"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M10 17.6c.4-1.3 1.2-2 2-2.5.8.5 1.6 1.2 2 2.5z" fill="#fff" />
      </svg>
      B4Gone
    </Link>
  );
}
