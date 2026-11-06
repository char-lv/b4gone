import Link from "next/link";

export default function ItemNotFound() {
  return (
    <>
      <Link
        href="/items"
        className="mb-4 inline-block text-[0.9375rem] font-semibold text-accent underline decoration-accent-line underline-offset-[3px] hover:text-accent-hover hover:decoration-current"
      >
        Back to items
      </Link>
      <h1 className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">Item not found</h1>
      <p className="mt-1.5 text-muted">It may have been deleted, or the link may be incomplete.</p>
    </>
  );
}
