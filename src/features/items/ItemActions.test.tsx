import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Item } from "./item-repository";
import { ItemActions } from "./ItemActions";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const fetchMock = vi.fn<typeof fetch>();

// Today is Nov 5, 2026 in the test time zone (America/New_York); the return deadline is in 3 days.
const NOW = new Date("2026-11-05T17:00:00Z");
const COAT: Item = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Wool coat",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: "2027-10-09",
  status: "active",
};
const RETURNED: Item = { ...COAT, status: "returned" };

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function deleteDialog() {
  return screen.getByRole("dialog", { name: "Delete “Wool coat”?" });
}

describe("ItemActions", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("offers edit, return, and delete for an active item", () => {
    render(<ItemActions item={COAT} />);

    expect(screen.getByRole("link", { name: "Edit item" })).toHaveAttribute("href", `/items/${COAT.id}/edit`);
    expect(screen.getByRole("button", { name: "Mark as returned" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete item" })).toBeInTheDocument();
  });

  it("offers Undo return for a returned item", () => {
    render(<ItemActions item={RETURNED} />);

    expect(screen.getByRole("button", { name: "Undo return" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit item" })).toBeInTheDocument();
  });

  describe("Mark as returned and Undo return", () => {
    it("saves the new status, refreshes the views, and keeps focus on the same button", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { item: RETURNED }));
      const user = userEvent.setup();
      const { rerender } = render(<ItemActions item={COAT} />);
      const toggle = screen.getByRole("button", { name: "Mark as returned" });

      await user.click(toggle);

      expect(fetchMock).toHaveBeenCalledWith(`/api/items/${COAT.id}/status`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "returned" }),
      });
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Marked “Wool coat” as returned. 1 deadline removed from the dashboard.",
      );

      // The refreshed page passes the saved item; the button is the same element with new text.
      rerender(<ItemActions item={RETURNED} />);
      expect(screen.getByRole("button", { name: "Undo return" })).toBe(toggle);
      expect(toggle).toHaveFocus();
    });

    it("counts every deadline that leaves the dashboard", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { item: RETURNED }));
      const user = userEvent.setup();
      render(<ItemActions item={{ ...COAT, warrantyExpiration: "2026-12-05" }} />);

      await user.click(screen.getByRole("button", { name: "Mark as returned" }));

      expect(screen.getByRole("status")).toHaveTextContent("2 deadlines removed from the dashboard.");
    });

    it("says when the item had no deadlines on the dashboard", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { item: RETURNED }));
      const user = userEvent.setup();
      render(<ItemActions item={{ ...COAT, returnDeadline: "2026-12-06" }} />);

      await user.click(screen.getByRole("button", { name: "Mark as returned" }));

      expect(screen.getByRole("status")).toHaveTextContent(
        "Marked “Wool coat” as returned. It had no deadlines on the dashboard.",
      );
    });

    it("says which deadlines come back after an undo", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { item: COAT }));
      const user = userEvent.setup();
      render(<ItemActions item={RETURNED} />);

      await user.click(screen.getByRole("button", { name: "Undo return" }));

      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ status: "active" });
      expect(screen.getByRole("status")).toHaveTextContent("“Wool coat” is active again. 1 deadline back on the dashboard.");
    });

    it("says when an undo brings nothing back because the dates are outside the next 30 days", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { item: COAT }));
      const user = userEvent.setup();
      render(<ItemActions item={{ ...RETURNED, returnDeadline: "2026-11-04" }} />);

      await user.click(screen.getByRole("button", { name: "Undo return" }));

      expect(screen.getByRole("status")).toHaveTextContent(
        "“Wool coat” is active again. None of its dates fall in the next 30 days, so the dashboard is unchanged.",
      );
    });

    it("sends one request for repeated clicks while the change is pending", async () => {
      let finish: (response: Response) => void = () => {};
      fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Mark as returned" }));
      const pending = screen.getByRole("button", { name: "Saving…" });
      expect(pending).toHaveAttribute("aria-disabled", "true");
      await user.click(pending);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      await act(async () => finish(jsonResponse(200, { item: RETURNED })));
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["the network fails", () => fetchMock.mockRejectedValue(new TypeError("Failed to fetch")), "Couldn’t mark this item as returned. Try again."],
      ["the server fails", () => fetchMock.mockResolvedValue(jsonResponse(500, { error: { code: "server_error" } })), "Couldn’t mark this item as returned. Try again."],
      ["the user was signed out", () => fetchMock.mockResolvedValue(jsonResponse(401, { error: { code: "unauthenticated" } })), "You’ve been signed out. Sign in again in a new tab, then try again."],
    ])("shows an error and lets the user retry when %s", async (_label, arrange, message) => {
      arrange();
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Mark as returned" }));

      expect(screen.getByRole("alert")).toHaveTextContent(message);
      expect(refresh).not.toHaveBeenCalled();
      const toggle = screen.getByRole("button", { name: "Mark as returned" });
      expect(toggle).not.toHaveAttribute("aria-disabled");

      fetchMock.mockResolvedValue(jsonResponse(200, { item: RETURNED }));
      await user.click(toggle);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("names the undo in its error message", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      const user = userEvent.setup();
      render(<ItemActions item={RETURNED} />);

      await user.click(screen.getByRole("button", { name: "Undo return" }));

      expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t undo the return. Try again.");
    });

    it("says when the item was deleted elsewhere and links to the list", async () => {
      fetchMock.mockResolvedValue(jsonResponse(404, { error: { code: "not_found" } }));
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Mark as returned" }));

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("This item no longer exists.");
      expect(within(alert).getByRole("link", { name: "Go to your items" })).toHaveAttribute("href", "/items");
    });
  });

  describe("Delete item", () => {
    it("asks first, naming the item and the dashboard deadlines it removes", async () => {
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Delete item" }));

      expect(deleteDialog()).toHaveAccessibleDescription("This removes the item and its 1 dashboard deadline.");
      expect(within(deleteDialog()).getByRole("button", { name: "Keep item" })).toHaveFocus();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("uses the plural for two deadlines and leaves the count out when there are none", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<ItemActions item={{ ...COAT, warrantyExpiration: "2026-11-30" }} />);
      await user.click(screen.getByRole("button", { name: "Delete item" }));
      expect(deleteDialog()).toHaveAccessibleDescription("This removes the item and its 2 dashboard deadlines.");
      unmount();

      render(<ItemActions item={RETURNED} />);
      await user.click(screen.getByRole("button", { name: "Delete item" }));
      expect(deleteDialog()).toHaveAccessibleDescription("This removes the item.");
    });

    it("keeps the item when the user changes their mind, and returns focus to Delete item", async () => {
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Delete item" }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Keep item" }));

      expect(fetchMock).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Delete item" })).toHaveFocus();
    });

    it("deletes, then opens the list before refreshing so the deleted page is never shown again", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Delete item" }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Delete item" }));

      expect(fetchMock).toHaveBeenCalledWith(`/api/items/${COAT.id}`, { method: "DELETE" });
      expect(push).toHaveBeenCalledWith("/items?deleted=1");
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(push.mock.invocationCallOrder[0]).toBeLessThan(refresh.mock.invocationCallOrder[0]);
      // The dialog stays in its pending state until the list replaces this page.
      expect(within(deleteDialog()).getByRole("button", { name: "Deleting…" })).toBeInTheDocument();
    });

    it("sends one request for repeated clicks", async () => {
      fetchMock.mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Delete item" }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Delete item" }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Deleting…" }));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(within(deleteDialog()).getByRole("button", { name: "Keep item" })).toHaveAttribute("aria-disabled", "true");
    });

    it("keeps the dialog open with an error when the delete fails", async () => {
      fetchMock.mockResolvedValue(jsonResponse(500, { error: { code: "server_error" } }));
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Delete item" }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Delete item" }));

      expect(within(deleteDialog()).getByRole("alert")).toHaveTextContent("Couldn’t delete this item. Try again.");
      expect(push).not.toHaveBeenCalled();

      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Delete item" }));
      expect(push).toHaveBeenCalledWith("/items?deleted=1");
    });

    it("says when the item was already deleted elsewhere", async () => {
      fetchMock.mockResolvedValue(jsonResponse(404, { error: { code: "not_found" } }));
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Delete item" }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Delete item" }));

      const alert = within(deleteDialog()).getByRole("alert");
      expect(alert).toHaveTextContent("This item no longer exists.");
      expect(within(alert).getByRole("link", { name: "Go to your items" })).toHaveAttribute("href", "/items");
    });

    it("shows a failure on the page if the browser closed the dialog while deleting", async () => {
      let finish: (response: Response) => void = () => {};
      fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const user = userEvent.setup();
      render(<ItemActions item={COAT} />);

      await user.click(screen.getByRole("button", { name: "Delete item" }));
      await user.click(within(deleteDialog()).getByRole("button", { name: "Delete item" }));
      act(() => {
        (screen.getByRole("dialog") as HTMLDialogElement).close();
      });
      await act(async () => finish(jsonResponse(500, { error: { code: "server_error" } })));

      expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t delete this item. Try again.");
    });
  });
});
