// The Items page body (issue #4): a table on wider screens that becomes one card per item on phones,
// following the prototype. Edit, return, and delete actions live on the details page (#5).
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { formatDateOnly } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import type { Item } from "./item-repository";
import { ItemStatusTag } from "./ItemStatusTag";

const COLUMNS = ["Name", "Purchased", "Price", "Return by", "Warranty until", "Status"] as const;

// On phones the header row is hidden and each cell shows its column name from data-label.
const CELL =
  "border-b border-line px-4 py-3.5 align-top max-sm:grid max-sm:grid-cols-[7.5rem_1fr] max-sm:gap-x-2 max-sm:border-0 max-sm:px-0 max-sm:py-1 max-sm:before:text-sm max-sm:before:font-medium max-sm:before:text-muted max-sm:before:content-[attr(data-label)]";

function Muted({ children }: { children: string }) {
  return <span className="text-muted max-sm:justify-self-start">{children}</span>;
}

function DateCell({ value }: { value: string | null }) {
  return value ? formatDateOnly(value) : <Muted>Not set</Muted>;
}

function itemCount(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

function AddItemLink() {
  return (
    <Link href="/items/new" className={buttonClassName("primary")}>
      Add item
    </Link>
  );
}

export function ItemList({ items }: { items: Item[]; deleted?: boolean }) {
  const returned = items.filter((item) => item.status === "returned").length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 max-sm:mb-5">
        <h1 className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">Items</h1>
        {items.length > 0 ? <AddItemLink /> : null}
      </div>

      {items.length === 0 ? (
        <section className="max-w-[40rem] rounded-card border border-line bg-surface px-[1.375rem] py-6 shadow-card">
          <h2 className="mb-1.5 text-[1.0625rem] font-semibold">No items yet</h2>
          <p className="mb-4 max-w-[36rem] text-muted">
            Add a purchase to keep its return deadline and warranty expiration in one place.
          </p>
          <AddItemLink />
        </section>
      ) : (
        <>
          <p className="-mt-3 mb-4 text-muted">
            {itemCount(items.length)}: {items.length - returned} active, {returned} returned. Newest purchases first.
          </p>
          <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card max-sm:overflow-visible max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none">
            {/* Explicit roles keep the table semantics when the phone layout changes the display type. */}
            <table role="table" className="w-full border-collapse text-[0.9375rem] max-sm:block">
              <caption className="sr-only">Items</caption>
              <thead role="rowgroup" className="max-sm:sr-only">
                <tr role="row">
                  {COLUMNS.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      role="columnheader"
                      className={`border-b border-line px-4 py-3 text-[0.8125rem] font-semibold whitespace-nowrap text-muted ${
                        column === "Price" ? "text-right" : "text-left"
                      }`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup" className="max-sm:block">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    role="row"
                    className="max-sm:mb-3 max-sm:block max-sm:rounded-card max-sm:border max-sm:border-line max-sm:bg-surface max-sm:p-4 max-sm:shadow-card [&:last-child>*]:border-b-0"
                  >
                    <th
                      scope="row"
                      role="rowheader"
                      data-label="Name"
                      className="border-b border-line px-4 py-3.5 text-left align-top font-normal max-sm:block max-sm:border-0 max-sm:px-0 max-sm:pt-0 max-sm:pb-2 max-sm:text-[1.0625rem]"
                    >
                      <Link
                        href={`/items/${item.id}`}
                        className="font-semibold break-words text-accent underline decoration-accent-line underline-offset-[3px] hover:text-accent-hover hover:decoration-current"
                      >
                        {item.name}
                      </Link>
                    </th>
                    <td role="cell" data-label="Purchased" className={CELL}>
                      {formatDateOnly(item.purchaseDate)}
                    </td>
                    <td
                      role="cell"
                      data-label="Price"
                      className={`${CELL} text-right whitespace-nowrap tabular-nums max-sm:text-left`}
                    >
                      {item.priceCents === null ? <Muted>Not entered</Muted> : formatUsd(item.priceCents)}
                    </td>
                    <td role="cell" data-label="Return by" className={CELL}>
                      <DateCell value={item.returnDeadline} />
                    </td>
                    <td role="cell" data-label="Warranty until" className={CELL}>
                      <DateCell value={item.warrantyExpiration} />
                    </td>
                    <td role="cell" data-label="Status" className={`${CELL} max-sm:items-start`}>
                      <span className="max-sm:justify-self-start">
                        <ItemStatusTag status={item.status} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
