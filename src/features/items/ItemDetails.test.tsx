import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Item } from "./item-repository";
import { ItemDetails } from "./ItemDetails";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

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
    afterEach(() => {
      window.history.replaceState(null, "", "/");
      vi.unstubAllGlobals();
    });

    // Issue #5: only one confirmation at a time, so the newer message is not read next to a stale one.
    it.each([
      ["a status change succeeds", 200, "Marked “Wool coat” as returned."],
      ["a status change fails", 500, "Couldn’t mark this item as returned. Try again."],
    ])("hides “Item saved.” when %s", async (_label, status, message) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify({ item: { ...COAT, status: "returned" } }), { status })),
      );
      const user = userEvent.setup();
      render(<ItemDetails item={COAT} saved />);
      await screen.findByText("Item saved.");

      await user.click(screen.getByRole("button", { name: "Mark as returned" }));

      expect(await screen.findByText(message, { exact: false })).toBeInTheDocument();
      expect(screen.queryByText("Item saved.")).not.toBeInTheDocument();
    });

    it("confirms it in a status region that is already on the page", async () => {
      render(<ItemDetails item={COAT} saved />);

      // The region exists before its text, so screen readers announce the change.
      expect(await screen.findByText("Item saved.")).toBeInTheDocument();
      expect(screen.getByText("Item saved.").closest("[role=status]")).toBeInTheDocument();
    });

    it("moves focus to the item's name so keyboard and screen reader users know where they are", async () => {
      render(<ItemDetails item={COAT} saved />);

      await screen.findByText("Item saved.");
      expect(screen.getByRole("heading", { level: 1, name: "Wool coat" })).toHaveFocus();
    });

    it("drops ?saved=1 from the address so a reload does not confirm it again", async () => {
      render(<ItemDetails item={COAT} saved />);

      await screen.findByText("Item saved.");
      expect(window.location.pathname + window.location.search).toBe(`/items/${COAT.id}`);
    });
  });

  it("shows no confirmation when the item is opened later", async () => {
    render(<ItemDetails item={COAT} saved={false} />);

    await act(async () => {});
    expect(screen.queryByText("Item saved.")).not.toBeInTheDocument();
  });

  // Issue #5.
  it("shows the item's dashboard deadlines and its actions", () => {
    render(<ItemDetails item={COAT} saved={false} />);

    expect(screen.getByRole("heading", { level: 2, name: "On the dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit item" })).toHaveAttribute("href", `/items/${COAT.id}/edit`);
    expect(screen.getByRole("button", { name: "Mark as returned" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete item" })).toBeInTheDocument();
  });
});
