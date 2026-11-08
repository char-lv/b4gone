import { itemDeadlines, type DeadlineItem } from "./item-deadlines";

const TODAY = "2026-11-08";

function item(overrides: Partial<DeadlineItem> & Pick<DeadlineItem, "id">): DeadlineItem {
  return {
    name: `Item ${overrides.id}`,
    returnDeadline: null,
    warrantyExpiration: null,
    status: "active",
    ...overrides,
  };
}

describe("itemDeadlines", () => {
  it("gives an active item both a return and a warranty deadline", () => {
    const deadlines = itemDeadlines(
      [item({ id: "a", name: "Wool coat", returnDeadline: "2026-11-20", warrantyExpiration: "2026-11-10" })],
      TODAY,
    );

    expect(deadlines).toEqual([
      { itemId: "a", name: "Wool coat", kind: "warranty", date: "2026-11-10" },
      { itemId: "a", name: "Wool coat", kind: "return", date: "2026-11-20" },
    ]);
  });

  it("gives a returned item no deadlines (US-04)", () => {
    expect(
      itemDeadlines([item({ id: "a", status: "returned", returnDeadline: TODAY, warrantyExpiration: "2026-11-09" })], TODAY),
    ).toEqual([]);
  });

  it("keeps today and later, drops past dates, and leaves the 30-day window to the caller", () => {
    const deadlines = itemDeadlines(
      [
        item({ id: "today", returnDeadline: TODAY }),
        item({ id: "yesterday", returnDeadline: "2026-11-07", warrantyExpiration: "2027-11-08" }),
        item({ id: "none" }),
      ],
      TODAY,
    );

    expect(deadlines.map(({ itemId, kind, date }) => [itemId, kind, date])).toEqual([
      ["today", "return", TODAY],
      ["yesterday", "warranty", "2027-11-08"],
    ]);
  });

  it("sorts by date, then return before warranty, then name", () => {
    const deadlines = itemDeadlines(
      [
        item({ id: "b", name: "Lamp", warrantyExpiration: "2026-11-12" }),
        item({ id: "c", name: "Desk", warrantyExpiration: "2026-11-12" }),
        item({ id: "a", name: "Zebra rug", returnDeadline: "2026-11-12" }),
        item({ id: "d", name: "Boots", returnDeadline: "2026-11-09" }),
      ],
      TODAY,
    );

    expect(deadlines.map((deadline) => deadline.itemId)).toEqual(["d", "a", "c", "b"]);
  });
});
