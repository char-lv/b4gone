import Link from "next/link";

/** The link above a page heading that returns to the list it came from, such as "Back to items". */
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-block text-[0.9375rem] font-semibold text-accent underline decoration-accent-line underline-offset-[3px] hover:text-accent-hover hover:decoration-current"
    >
      {children}
    </Link>
  );
}
