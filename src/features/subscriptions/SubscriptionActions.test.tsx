import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Subscription } from "./subscription-repository";
import { SubscriptionActions } from "./SubscriptionActions";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const fetchMock = vi.fn<typeof fetch>();

const MUSIC: Subscription = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Music plan",
  amountCents: 1099,
  billingCycle: "monthly",
  firstBillingDate: "2026-01-31",
  status: "active",
};
const CANCELLED: Subscription = { ...MUSIC, status: "cancelled" };

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function deleteDialog() {
  return screen.getByRole("dialog", { name: "Delete “Music plan”?" });
}

describe("SubscriptionActions", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("offers edit, cancel, and delete for an active subscription, and Reactivate once cancelled", () => {
    const { rerender } = render(<SubscriptionActions subscription={MUSIC} />);

    expect(screen.getByRole("link", { name: "Edit subscription" })).toHaveAttribute("href", `/subscriptions/${MUSIC.id}/edit`);
    expect(screen.getByRole("button", { name: "Cancel subscription" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete subscription" })).toBeInTheDocument();

    rerender(<SubscriptionActions subscription={CANCELLED} />);
    expect(screen.getByRole("button", { name: "Reactivate subscription" })).toBeInTheDocument();
  });

  it("cancels with the user's time zone, confirms what changed, and refreshes the views", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { subscription: { ...CANCELLED, nextBillingDate: null } }));
    const user = userEvent.setup();
    render(<SubscriptionActions subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Cancel subscription" }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/subscriptions/${MUSIC.id}/status`);
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({ status: "cancelled", timeZone: "America/New_York" });
    expect(await screen.findByText("Cancelled “Music plan”. Its renewal reminder and cost no longer count.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reactivates and names the next charge the server calculated from the original anchor", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { subscription: { ...MUSIC, nextBillingDate: "2026-11-30" } }));
    const user = userEvent.setup();
    render(<SubscriptionActions subscription={CANCELLED} />);

    await user.click(screen.getByRole("button", { name: "Reactivate subscription" }));

    expect(await screen.findByText("“Music plan” is active again. Next charge: Nov 30, 2026.")).toBeInTheDocument();
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ status: "active" });
  });

  it("ignores repeated clicks while a status change is pending", async () => {
    let answer: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const user = userEvent.setup();
    render(<SubscriptionActions subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Cancel subscription" }));
    await user.click(screen.getByRole("button", { name: "Saving…" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    answer(jsonResponse(200, { subscription: { ...CANCELLED, nextBillingDate: null } }));
    expect(await screen.findByText(/Cancelled “Music plan”/)).toBeInTheDocument();
  });

  it.each([
    [500, "Couldn’t cancel this subscription. Try again."],
    [401, "You’ve been signed out. Sign in again in a new tab, then try again."],
    [404, "This subscription no longer exists. It may have been deleted in another tab."],
  ])("explains a failed cancellation (HTTP %i) without refreshing", async (status, message) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { error: { code: "x", message: "x" } }));
    const user = userEvent.setup();
    render(<SubscriptionActions subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Cancel subscription" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("deletes only after confirmation, then opens the list", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const user = userEvent.setup();
    render(<SubscriptionActions subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Delete subscription" }));
    expect(deleteDialog()).toHaveAccessibleDescription("This removes the subscription and its renewal reminder.");
    expect(within(deleteDialog()).getByRole("button", { name: "Keep subscription" })).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(within(deleteDialog()).getByRole("button", { name: "Delete subscription" }));

    expect(fetchMock).toHaveBeenCalledWith(`/api/subscriptions/${MUSIC.id}`, { method: "DELETE" });
    expect(push).toHaveBeenCalledWith("/subscriptions?deleted=1");
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the subscription and returns focus when the deletion is not confirmed", async () => {
    const user = userEvent.setup();
    render(<SubscriptionActions subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Delete subscription" }));
    await user.click(within(deleteDialog()).getByRole("button", { name: "Keep subscription" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete subscription" })).toHaveFocus();
  });

  it("shows a failed deletion inside the dialog and stays on the page", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { error: { code: "server_error", message: "x" } }));
    const user = userEvent.setup();
    render(<SubscriptionActions subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Delete subscription" }));
    await user.click(within(deleteDialog()).getByRole("button", { name: "Delete subscription" }));

    expect(await within(deleteDialog()).findByRole("alert")).toHaveTextContent("Couldn’t delete this subscription. Try again.");
    expect(push).not.toHaveBeenCalled();
  });
});
