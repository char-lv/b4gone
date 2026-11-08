import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditSubscriptionPanel } from "./EditSubscriptionPanel";
import { NewSubscriptionPanel } from "./NewSubscriptionPanel";
import type { Subscription } from "./subscription-repository";

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
  status: "cancelled",
};

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

async function fillNew(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Service name/), "Music plan");
  await user.type(screen.getByLabelText(/^Amount/), "10.99");
  await user.type(screen.getByLabelText(/^First billing date/), "2026-01-31");
}

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NewSubscriptionPanel", () => {
  it("saves with the user's time zone, refreshes the views, and opens the new subscription", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { subscription: { ...MUSIC, status: "active", nextBillingDate: "2026-10-31" } }));
    const user = userEvent.setup();
    render(<NewSubscriptionPanel />);
    expect(screen.getByRole("heading", { level: 1, name: "Add subscription" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Add subscription" })).toBeInTheDocument();

    await fillNew(user);
    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/subscriptions");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Music plan",
      amountCents: 1099,
      billingCycle: "monthly",
      firstBillingDate: "2026-01-31",
      timeZone: "America/New_York",
    });
    expect(refresh).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(`/subscriptions/${MUSIC.id}?saved=1`);
  });

  it("shows the API's amountCents error on the Amount field and keeps the draft", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { error: { code: "validation_failed", message: "x", fields: { amountCents: "Enter an amount up to $999,999.99." } } }),
    );
    const user = userEvent.setup();
    render(<NewSubscriptionPanel />);

    await fillNew(user);
    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    expect(await screen.findByText("Enter an amount up to $999,999.99.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Service name/)).toHaveValue("Music plan");
    expect(push).not.toHaveBeenCalled();
  });

  it("asks a signed-out user to sign in again without losing the draft", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: { code: "unauthenticated", message: "x" } }));
    const user = userEvent.setup();
    render(<NewSubscriptionPanel />);

    await fillNew(user);
    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You’ve been signed out. Your entries are still here. Sign in again in a new tab, then select “Save subscription”.",
    );
    expect(screen.getByLabelText(/^Amount/)).toHaveValue("10.99");
  });

  it("returns to the list on Cancel", async () => {
    const user = userEvent.setup();
    render(<NewSubscriptionPanel />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(push).toHaveBeenCalledWith("/subscriptions");
  });
});

describe("EditSubscriptionPanel", () => {
  it("starts from the saved values and replaces them, keeping the status out of the request", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { subscription: { ...MUSIC, name: "Family music", nextBillingDate: null } }));
    const user = userEvent.setup();
    render(<EditSubscriptionPanel subscription={MUSIC} />);
    expect(screen.getByRole("heading", { level: 1, name: "Edit subscription" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Amount/)).toHaveValue("10.99");

    await user.clear(screen.getByLabelText(/^Service name/));
    await user.type(screen.getByLabelText(/^Service name/), "Family music");
    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/subscriptions/${MUSIC.id}`);
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Family music",
      amountCents: 1099,
      billingCycle: "monthly",
      firstBillingDate: "2026-01-31",
      timeZone: "America/New_York",
    });
    expect(refresh).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(`/subscriptions/${MUSIC.id}?saved=1`);
  });

  it("explains that a deleted subscription cannot be saved and links to the list", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: { code: "not_found", message: "Subscription not found." } }));
    const user = userEvent.setup();
    render(<EditSubscriptionPanel subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This subscription no longer exists. It may have been deleted in another tab.");
    expect(screen.getByRole("link", { name: "Go to your subscriptions" })).toHaveAttribute("href", "/subscriptions");
  });

  it("returns to the details page on Cancel", async () => {
    const user = userEvent.setup();
    render(<EditSubscriptionPanel subscription={MUSIC} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(push).toHaveBeenCalledWith(`/subscriptions/${MUSIC.id}`);
  });
});
