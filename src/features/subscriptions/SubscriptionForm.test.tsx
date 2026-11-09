import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionSubmitError } from "./subscription-schema";

function field(label: RegExp): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field(/^Service name/), "  Music plan ");
  await user.type(field(/^Amount/), "10.99");
  await user.type(field(/^First billing date/), "2027-01-31");
}

describe("SubscriptionForm", () => {
  it("shows the four fields in order with required markers and monthly selected", () => {
    render(<SubscriptionForm onSubmit={vi.fn()} />);

    const labels = ["Service name", "Amount (USD)", "Monthly", "Yearly", "First billing date"];
    for (const label of labels) expect(screen.getByLabelText(new RegExp(`^${label.replace(/[()]/g, "\\$&")}`))).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Billing cycle/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Monthly" })).toBeChecked();
    expect(screen.getAllByText("(required)")).toHaveLength(4);
  });

  it("explains each error next to its field and focuses the first one", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SubscriptionForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    expect(screen.getByText("Fix 3 fields to save this subscription.")).toBeInTheDocument();
    expect(field(/^Service name/)).toHaveAccessibleDescription(expect.stringContaining("Enter a service name."));
    expect(field(/^Amount/)).toHaveAccessibleDescription(expect.stringContaining("Enter the amount. Use 0 for a free plan."));
    expect(field(/^First billing date/)).toHaveAccessibleDescription(expect.stringContaining("Enter the first billing date."));
    expect(field(/^Service name/)).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects malformed amounts instead of rounding or stripping them", async () => {
    const user = userEvent.setup();
    render(<SubscriptionForm onSubmit={vi.fn()} />);
    await fillValid(user);

    await user.clear(field(/^Amount/));
    await user.type(field(/^Amount/), "1,,2");
    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    expect(field(/^Amount/)).toHaveAccessibleDescription(expect.stringContaining("Use digits only, like 15.99, without $ or commas."));
    expect(field(/^Amount/)).toHaveFocus();
  });

  it("sends a trimmed name, integer cents, the chosen cycle, and a future first billing date", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SubscriptionForm onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole("radio", { name: "Yearly" }));
    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Music plan",
      amountCents: 1099,
      billingCycle: "yearly",
      firstBillingDate: "2027-01-31",
    });
  });

  it("locks the form while saving and ignores a second submission", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<SubscriptionForm onSubmit={onSubmit} />);
    await fillValid(user);

    await user.click(screen.getByRole("button", { name: "Save subscription" }));
    await user.click(screen.getByRole("button", { name: "Saving…" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(field(/^Service name/)).toHaveAttribute("readonly");
    expect(screen.getByRole("radio", { name: "Yearly" })).toBeDisabled();
    finish();
    expect(await screen.findByRole("button", { name: "Save subscription" })).toBeInTheDocument();
  });

  it("keeps the draft and offers a retry when the save fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("offline"));
    render(<SubscriptionForm onSubmit={onSubmit} />);
    await fillValid(user);

    await user.click(screen.getByRole("button", { name: "Save subscription" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t save this subscription. Your entries are still here. Select “Save subscription” to try again.",
    );
    expect(field(/^Service name/)).toHaveValue("  Music plan ");
    expect(field(/^Amount/)).toHaveValue("10.99");
  });

  it("shows server field errors next to the fields and a server message with its link", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new SubscriptionSubmitError({ amount: "Enter an amount up to $999,999.99." }))
      .mockRejectedValueOnce(
        Object.assign(new Error("gone"), { formMessage: "This subscription no longer exists.", formLink: { href: "/subscriptions", label: "Go to your subscriptions" } }),
      );
    render(<SubscriptionForm onSubmit={onSubmit} />);
    await fillValid(user);

    await user.click(screen.getByRole("button", { name: "Save subscription" }));
    expect(await screen.findByText("Enter an amount up to $999,999.99.")).toBeInTheDocument();
    expect(field(/^Amount/)).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Save subscription" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This subscription no longer exists.");
    expect(screen.getByRole("link", { name: "Go to your subscriptions" })).toHaveAttribute("href", "/subscriptions");
  });

  it("starts from saved values when editing", () => {
    render(
      <SubscriptionForm
        onSubmit={vi.fn()}
        initialDraft={{ name: "Cloud storage", amount: "0.00", billingCycle: "yearly", firstBillingDate: "2024-02-29" }}
      />,
    );

    expect(field(/^Service name/)).toHaveValue("Cloud storage");
    expect(field(/^Amount/)).toHaveValue("0.00");
    expect(screen.getByRole("radio", { name: "Yearly" })).toBeChecked();
    expect(field(/^First billing date/)).toHaveValue("2024-02-29");
  });

  it("previews the next charge from the entered anchor and cycle, including a charge due today", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-02-01T17:00:00Z"));
    try {
      const user = userEvent.setup();
      render(<SubscriptionForm onSubmit={vi.fn()} />);
      expect(screen.getByText("Next charge: enter a first billing date to see it.")).toBeInTheDocument();

      await user.type(field(/^First billing date/), "2026-01-31");
      expect(screen.getByText("Next charge: Feb 28, 2026 (In 27 days)")).toBeInTheDocument();

      await user.click(screen.getByRole("radio", { name: "Yearly" }));
      expect(screen.getByText("Next charge: Jan 31, 2027 (In 364 days)")).toBeInTheDocument();

      await user.clear(field(/^First billing date/));
      await user.type(field(/^First billing date/), "2026-02-01");
      expect(screen.getByText("Next charge: Feb 1, 2026 (Due today)")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("calls onCancel from Cancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<SubscriptionForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
