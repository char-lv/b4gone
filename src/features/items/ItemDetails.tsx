// One saved item (issue #4) with its dashboard deadlines and its edit, return, undo, and delete actions (#5).
import type { ReactNode } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { formatDateOnly } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import type { Item } from "./item-repository";
import { ITEM_STATUS_LABELS, ItemStatusTag } from "./ItemStatusTag";
import { FlashNotice } from "./FlashNotice";
import { ItemActions } from "./ItemActions";
import { ItemDashboardDeadlines } from "./ItemDashboardDeadlines";
import { NoticeScope } from "./NoticeScope";

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
    <NoticeScope>
      <BackLink href="/items">Back to items</BackLink>

      <FlashNotice show={saved} param="saved" message="Item saved." focusId="item-title" />

      <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {/* tabIndex lets the save confirmation move focus here; the heading is not a tab stop. */}
        <h1 id="item-title" tabIndex={-1} className="min-w-0 outline-none text-[1.375rem] font-semibold tracking-tight break-words sm:text-[1.625rem]">
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
        <Row term="Status">{ITEM_STATUS_LABELS[item.status]}</Row>
      </dl>

      <ItemDashboardDeadlines item={item} />
      <ItemActions item={item} />
    </NoticeScope>
  );
}
