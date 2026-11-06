import { render, screen, within } from "@testing-library/react";
import type { Item } from "./item-repository";
import { ItemList } from "./ItemList";

const COAT: Item = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Wool coat",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: null,
  status: "active",
};
const LAMP: Item = {
  ...COAT,
  id: "1f0c3b9e-8a4d-4c2b-9e7f-5a6b7c8d9e0f",
  name: "Desk lamp",
  priceCents: null,
  returnDeadline: null,
  warrantyExpiration: "2027-09-30",
  status: "returned",
};

describe("ItemList", () => {
  it("shows an empty state with an Add item link when there are no items", () => {
    render(<ItemList items={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Items" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "No items yet" })).toBeInTheDocument();
    expect(screen.getByText(/keep its return deadline and warranty expiration in one place/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Add item" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Add item" })).toHaveAttribute("href", "/items/new");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("lists each item with its price, deadlines, and status", () => {
    render(<ItemList items={[COAT, LAMP]} />);

    const table = screen.getByRole("table", { name: "Items" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Name",
      "Purchased",
      "Price",
      "Return by",
      "Warranty until",
      "Status",
    ]);
    const [, coatRow, lampRow] = within(table).getAllByRole("row");
    // The name heads its row, so a screen reader names the item with every cell it reads.
    expect(within(coatRow).getByRole("rowheader")).toHaveTextContent("Wool coat");
    expect(within(lampRow).getByRole("rowheader")).toHaveTextContent("Desk lamp");
    expect(within(coatRow).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "Oct 9, 2026",
      "$189.50",
      "Nov 8, 2026",
      "Not set",
      "Active",
    ]);
    expect(within(lampRow).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "Oct 9, 2026",
      "Not entered",
      "Not set",
      "Sep 30, 2027",
      "Returned",
    ]);
  });

  it("links each name to the item's details", () => {
    render(<ItemList items={[COAT, LAMP]} />);

    expect(screen.getByRole("link", { name: "Wool coat" })).toHaveAttribute("href", `/items/${COAT.id}`);
    expect(screen.getByRole("link", { name: "Desk lamp" })).toHaveAttribute("href", `/items/${LAMP.id}`);
  });

  it("summarizes the counts and offers one Add item link above the list", () => {
    render(<ItemList items={[COAT, LAMP]} />);

    expect(screen.getByText("2 items: 1 active, 1 returned. Newest purchases first.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Add item" })).toHaveLength(1);
  });

  it("uses the singular for one item", () => {
    render(<ItemList items={[COAT]} />);

    expect(screen.getByText("1 item: 1 active, 0 returned. Newest purchases first.")).toBeInTheDocument();
  });
});
