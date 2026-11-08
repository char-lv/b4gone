"use client";

import type { Item } from "./item-repository";

/** The edit form for a saved item (issue #5). */
export function EditItemPanel({ item }: { item: Item }) {
  return <p>{item.name}</p>;
}
