// One saved item (issue #4). Edit, return, undo, and delete actions are added here by #5.
import Link from "next/link";
import type { ReactNode } from "react";
import { formatDateOnly } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import type { Item } from "./item-repository";
import { ItemStatusTag } from "./ItemStatusTag";

function NotSet({ children }: { children: string }) {
  return <span className="text-muted">{children}</span>;
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="border-b border-line px-5 py-3 text-[0.9375rem] font-medium text-muted max-sm:border-b-0 max-sm:pb-0">
        {term}
      </dt>
      <dd className="border-b border-line px-5 py-3">{children}</dd>
    </>
  );
}

export function ItemDetails({ item, saved }: { item: Item; saved: boolean }) {
  return (
    <>
      <Link
        href="/items"
        className="mb-4 inline-block text-[0.9375rem] font-semibold text-accent underline decoration-accent-line underline-offset-[3px] hover:text-accent-hover hover:decoration-current"
      >
        Back to items
      </Link>

      <div role="status" aria-live="polite">
        {saved ? (
          <p className="mb-5 max-w-[46rem] rounded-control border border-accent-line bg-accent-soft px-4 py-3 text-[0.9375rem]">
            Item saved.
          </p>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <h1 className="min-w-0 text-[1.375rem] font-semibold tracking-tight break-words sm:text-[1.625rem]">
          {item.name}
        </h1>
        <ItemStatusTag status={item.status} />
      </div>

      <dl className="grid max-w-[46rem] grid-cols-[minmax(10rem,13rem)_1fr] rounded-card border border-line bg-surface shadow-card max-sm:grid-cols-1 [&>:nth-last-child(-n+2)]:border-b-0">
        <Row term="Purchase date">{formatDateOnly(item.purchaseDate)}</Row>
        <Row term="Price">{item.priceCents === null ? <NotSet>Not entered</NotSet> : formatUsd(item.priceCents)}</Row>
        <Row term="Return deadline">
          {item.returnDeadline ? formatDateOnly(item.returnDeadline) : <NotSet>Not set</NotSet>}
        </Row>
        <Row term="Warranty expiration">
          {item.warrantyExpiration ? formatDateOnly(item.warrantyExpiration) : <NotSet>Not set</NotSet>}
        </Row>
        <Row term="Status">{item.status === "active" ? "Active" : "Returned"}</Row>
      </dl>
    </>
  );
}
