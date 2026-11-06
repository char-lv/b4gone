import type { ItemStatus } from "./item-repository";

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = { active: "Active", returned: "Returned" };

/** Active or Returned as text, so the status never depends on color alone. */
export function ItemStatusTag({ status }: { status: ItemStatus }) {
  const active = status === "active";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-px text-xs leading-normal font-semibold whitespace-nowrap ${
        active ? "border-transparent bg-accent-soft text-accent" : "border-line bg-neutral-soft text-muted"
      }`}
    >
      {ITEM_STATUS_LABELS[status]}
    </span>
  );
}
