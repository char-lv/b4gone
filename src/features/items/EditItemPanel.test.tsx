import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Item } from "./item-repository";
import { EditItemPanel } from "./EditItemPanel";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const fetchMock = vi.fn<typeof fetch>();

const COAT: Item = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Wool coat",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: null,
  status: "returned",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const saved = () => jsonResponse(200, { item: { ...COAT, name: "Navy wool coat" } });

async function rename(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText(/^Name/));
  await user.type(screen.getByLabelText(/^Name/), "Navy wool coat");
}

describe("EditItemPanel", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers({ toFake: ["Date"] });
    // 02:30 UTC on Oct 24 is still Oct 23 in the test time zone (America/New_York).
    vi.setSystemTime(new Date("2026-10-24T02:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens with the item's current values", () => {
    render(<EditItemPanel item={COAT} />);

    expect(screen.getByRole("heading", { level: 1, name: "Edit item" })).toBeInTheDocument();
    expect(screen.getByText("Editing “Wool coat”.")).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Edit item" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Wool coat");
    expect(screen.getByLabelText(/^Purchase date/)).toHaveValue("2026-10-09");
    expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", "2026-10-23");
    expect(screen.getByLabelText(/^Price/)).toHaveValue("189.50");
    expect(screen.getByLabelText(/^Return deadline/)).toHaveValue("2026-11-08");
    expect(screen.getByLabelText(/^Warranty expiration/)).toHaveValue("");
    expect(screen.getByRole("link", { name: "Back to item" })).toHaveAttribute("href", `/items/${COAT.id}`);
  });

  it("shows a free item's price as 0.00 and an unknown price as blank", () => {
    const { unmount } = render(<EditItemPanel item={{ ...COAT, priceCents: 0 }} />);
    expect(screen.getByLabelText(/^Price/)).toHaveValue("0.00");
    unmount();

    render(<EditItemPanel item={{ ...COAT, priceCents: null }} />);
    expect(screen.getByLabelText(/^Price/)).toHaveValue("");
  });

  it("saves every field with the browser's time zone, then opens the details page", async () => {
    fetchMock.mockResolvedValue(saved());
    const user = userEvent.setup();
    render(<EditItemPanel item={COAT} />);

    await rename(user);
    await user.clear(screen.getByLabelText(/^Price/));
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`/api/items/${COAT.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Navy wool coat",
        purchaseDate: "2026-10-09",
        priceCents: null,
        returnDeadline: "2026-11-08",
        warrantyExpiration: null,
        timeZone: "America/New_York",
      }),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(`/items/${COAT.id}?saved=1`);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeInTheDocument();
  });

  it("sends one request for repeated clicks and waits for the save", async () => {
    let finish: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<EditItemPanel item={COAT} />);

    await user.click(screen.getByRole("button", { name: "Save item" }));
    await user.click(screen.getByRole("button", { name: "Saving…" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    await act(async () => finish(saved()));
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("shows the server's field errors and keeps the changes", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: { code: "validation_failed", message: "Check the highlighted fields.", fields: { name: "Enter a name." } },
      }),
    );
    const user = userEvent.setup();
    render(<EditItemPanel item={COAT} />);

    await rename(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(screen.getByLabelText(/^Name/)).toHaveAccessibleDescription(expect.stringContaining("Enter a name."));
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Navy wool coat");
    expect(push).not.toHaveBeenCalled();
  });

  it.each([
    ["the network fails", () => fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))],
    ["the server fails", () => fetchMock.mockResolvedValue(jsonResponse(500, { error: { code: "server_error", message: "x" } }))],
  ])("keeps the changes and offers a retry when %s", async (_label, arrange) => {
    arrange();
    const user = userEvent.setup();
    render(<EditItemPanel item={COAT} />);

    await rename(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t save this item.");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Navy wool coat");
    expect(push).not.toHaveBeenCalled();
  });

  it("tells a signed-out user to sign in again and keeps the changes", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: { code: "unauthenticated", message: "Sign in to continue." } }));
    const user = userEvent.setup();
    render(<EditItemPanel item={COAT} />);

    await rename(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(screen.getByRole("alert")).toHaveTextContent("You’ve been signed out.");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Navy wool coat");
  });

  it("says when the item was deleted elsewhere and links back to the list", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: { code: "not_found", message: "Item not found." } }));
    const user = userEvent.setup();
    render(<EditItemPanel item={COAT} />);

    await rename(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("This item no longer exists.");
    expect(within(alert).getByRole("link", { name: "Go to your items" })).toHaveAttribute("href", "/items");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Navy wool coat");
    expect(push).not.toHaveBeenCalled();
  });

  it("returns to the details page on cancel without saving", async () => {
    const user = userEvent.setup();
    render(<EditItemPanel item={COAT} />);

    await rename(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(push).toHaveBeenCalledWith(`/items/${COAT.id}`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("while the page stays open across local midnight", () => {
    // 23:59 on Nov 4, 2026 in New York.
    const beforeMidnight = new Date("2026-11-05T04:59:00Z");
    const afterMidnight = new Date("2026-11-05T05:01:00Z");

    it("moves the purchase date limit to the new day", async () => {
      vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
      vi.setSystemTime(beforeMidnight);
      render(<EditItemPanel item={COAT} />);
      expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", "2026-11-04");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
      });

      expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", "2026-11-05");
    });

    it("accepts a purchase date of the new day without a reload", async () => {
      fetchMock.mockResolvedValue(saved());
      vi.setSystemTime(beforeMidnight);
      const user = userEvent.setup();
      render(<EditItemPanel item={COAT} />);

      vi.setSystemTime(afterMidnight);
      await user.clear(screen.getByLabelText(/^Purchase date/));
      await user.type(screen.getByLabelText(/^Purchase date/), "2026-11-05");
      await user.clear(screen.getByLabelText(/^Return deadline/));
      await user.click(screen.getByRole("button", { name: "Save item" }));

      expect(screen.queryByText("Purchase date can’t be in the future.")).not.toBeInTheDocument();
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ purchaseDate: "2026-11-05" });
    });
  });
});
