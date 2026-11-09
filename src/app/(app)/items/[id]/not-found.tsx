import { BackLink } from "@/components/ui/BackLink";

export default function ItemNotFound() {
  return (
    <>
      <BackLink href="/items">Back to items</BackLink>
      <h1 className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">Item not found</h1>
      <p className="mt-1.5 text-muted">It may have been deleted, or the link may be incomplete.</p>
    </>
  );
}
