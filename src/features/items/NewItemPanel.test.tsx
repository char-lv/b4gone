import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewItemPanel } from "./NewItemPanel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const fetchMock = vi.fn<typeof fetch>();
const ITEM_ID = "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const created = () => jsonResponse(201, { item: { id: ITEM_ID } });

async function fillCoat(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Name/), "Wool coat");
  await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-09");
  await user.type(screen.getByLabelText(/^Price/), "189.5");
  await user.type(screen.getByLabelText(/^Warranty expiration/), "2027-10-09");
}

describe("NewItemPanel", () => {
  beforeEach(() => {
    push.mockClear();
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

  it("limits the purchase date to the user's local today", () => {
    render(<NewItemPanel />);

    expect(screen.getByRole("heading", { level: 1, name: "Add item" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Add item" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", "2026-10-23");
    expect(screen.getByRole("link", { name: "Back to items" })).toHaveAttribute("href", "/items");
  });

  it("saves the item as JSON with the browser's time zone, then opens its details", async () => {
    fetchMock.mockResolvedValue(created());
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await fillCoat(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Wool coat",
        purchaseDate: "2026-10-09",
        priceCents: 18950,
        returnDeadline: null,
        warrantyExpiration: "2027-10-09",
        timeZone: "America/New_York",
      }),
    });
    expect(push).toHaveBeenCalledWith(`/items/${ITEM_ID}?saved=1`);
  });

  it("does not navigate before the save finishes, and sends one request for repeated clicks", async () => {
    let finish: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await fillCoat(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));
    await user.click(screen.getByRole("button", { name: "Saving…" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();

    await act(async () => finish(created()));
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("shows the server's field errors next to the fields and keeps the draft", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: { code: "validation_failed", message: "Check the highlighted fields.", fields: { priceCents: "Enter a smaller amount." } },
      }),
    );
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await fillCoat(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(screen.getByLabelText(/^Price/)).toHaveAccessibleDescription(expect.stringContaining("Enter a smaller amount."));
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Wool coat");
    expect(push).not.toHaveBeenCalled();
  });

  it.each([
    ["the network fails", () => fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))],
    ["the server fails", () => fetchMock.mockResolvedValue(jsonResponse(500, { error: { code: "server_error", message: "x" } }))],
    ["the session has ended", () => fetchMock.mockResolvedValue(jsonResponse(401, { error: { code: "unauthenticated", message: "x" } }))],
    ["the reply is not JSON", () => fetchMock.mockResolvedValue(new Response("<html>", { status: 502 }))],
  ])("keeps the draft and offers a retry when %s", async (_label, arrange) => {
    arrange();
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await fillCoat(user);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t save this item.");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Wool coat");
    expect(screen.getByLabelText(/^Price/)).toHaveValue("189.5");
    expect(push).not.toHaveBeenCalled();
  });

  it("does not send an invalid item", async () => {
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(screen.getByText("Enter a name.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns to the item list on cancel", async () => {
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(push).toHaveBeenCalledWith("/items");
  });

  describe("while the page stays open across local midnight", () => {
    // 23:59 on Nov 4, 2026 in New York (UTC-5 after daylight saving time ends on Nov 1).
    const beforeMidnight = new Date("2026-11-05T04:59:00Z");
    const afterMidnight = new Date("2026-11-05T05:01:00Z");

    it("accepts a purchase made on the new day without a reload", async () => {
      fetchMock.mockResolvedValue(created());
      vi.setSystemTime(beforeMidnight);
      const user = userEvent.setup();
      render(<NewItemPanel />);

      await user.type(screen.getByLabelText(/^Name/), "Night bus ticket");
      vi.setSystemTime(afterMidnight);
      await user.type(screen.getByLabelText(/^Purchase date/), "2026-11-05");
      await user.click(screen.getByRole("button", { name: "Save item" }));

      expect(screen.queryByText("Purchase date can’t be in the future.")).not.toBeInTheDocument();
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ purchaseDate: "2026-11-05" });
    });

    it("moves the purchase date limit to the new day", async () => {
      vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
      vi.setSystemTime(beforeMidnight);
      render(<NewItemPanel />);
      expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", "2026-11-04");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
      });

      expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", "2026-11-05");
    });

    it("still rejects a purchase dated after the new day", async () => {
      vi.setSystemTime(beforeMidnight);
      const user = userEvent.setup();
      render(<NewItemPanel />);

      await user.type(screen.getByLabelText(/^Name/), "Night bus ticket");
      vi.setSystemTime(afterMidnight);
      await user.type(screen.getByLabelText(/^Purchase date/), "2026-11-06");
      await user.click(screen.getByRole("button", { name: "Save item" }));

      expect(screen.getByText("Purchase date can’t be in the future.")).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
