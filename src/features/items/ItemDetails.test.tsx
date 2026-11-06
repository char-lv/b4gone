import { render, screen } from "@testing-library/react";
import type { Item } from "./item-repository";
import { ItemDetails } from "./ItemDetails";

const COAT: Item = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Wool coat",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: null,
  status: "active",
};

function detailValue(term: string): string | null | undefined {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
}

describe("ItemDetails", () => {
  it("shows the saved fields under the item's name and status", () => {
    render(<ItemDetails item={COAT} saved={false} />);

    expect(screen.getByRole("heading", { level: 1, name: "Wool coat" })).toBeInTheDocument();
    expect(screen.getByText("Active", { selector: "span" })).toBeInTheDocument();
    expect(detailValue("Purchase date")).toBe("Oct 9, 2026");
    expect(detailValue("Price")).toBe("$189.50");
    expect(detailValue("Return deadline")).toBe("Nov 8, 2026");
    expect(detailValue("Warranty expiration")).toBe("Not set");
    expect(detailValue("Status")).toBe("Active");
    expect(screen.getByRole("link", { name: "Back to items" })).toHaveAttribute("href", "/items");
  });

  it("describes a blank price and a returned item", () => {
    render(<ItemDetails item={{ ...COAT, priceCents: null, status: "returned" }} saved={false} />);

    expect(detailValue("Price")).toBe("Not entered");
    expect(detailValue("Status")).toBe("Returned");
  });

  describe("after a save", () => {
    beforeEach(() => window.history.replaceState(null, "", `/items/${COAT.id}?saved=1`));
    afterEach(() => window.history.replaceState(null, "", "/"));

    it("confirms it in a status region that is already on the page", async () => {
      render(<ItemDetails item={COAT} saved />);

      // The region exists before its text, so screen readers announce the change.
      expect(await screen.findByText("Item saved.")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Item saved.");
    });

    it("drops ?saved=1 from the address so a reload does not confirm it again", async () => {
      render(<ItemDetails item={COAT} saved />);

      await screen.findByText("Item saved.");
      expect(window.location.pathname + window.location.search).toBe(`/items/${COAT.id}`);
    });
  });

  it("shows no confirmation when the item is opened later", () => {
    render(<ItemDetails item={COAT} saved={false} />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
