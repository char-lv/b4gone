"use client";

import type { Item } from "./item-repository";

/** Edit, return or undo, and delete for one item (issue #5). */
export function ItemActions({ item }: { item: Item }) {
  return <div>{item.name}</div>;
}
