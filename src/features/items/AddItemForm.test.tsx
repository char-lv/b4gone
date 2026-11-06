import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddItemForm } from "./AddItemForm";

const today = "2026-10-23";

function renderForm(onSubmit = vi.fn(), onCancel = vi.fn()) {
  const user = userEvent.setup();
  render(<AddItemForm getToday={() => today} onSubmit={onSubmit} onCancel={onCancel} />);
  return { user, onSubmit, onCancel };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("AddItemForm", () => {
  it("shows the five fields in order with required markers", () => {
    renderForm();

    const fields = [
      screen.getByLabelText(/^Name/),
      screen.getByLabelText(/^Purchase date/),
      screen.getByLabelText(/^Price \(USD\)/),
      screen.getByLabelText(/^Return deadline/),
      screen.getByLabelText(/^Warranty expiration/),
    ];
    for (let i = 1; i < fields.length; i++) {
      expect(fields[i - 1].compareDocumentPosition(fields[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }

    expect(screen.getByLabelText(/^Name/)).toBeRequired();
    expect(screen.getByLabelText(/^Purchase date/)).toBeRequired();
    expect(screen.getByLabelText(/^Price \(USD\)/)).not.toBeRequired();
    expect(screen.getByText("Name").parentElement).toHaveTextContent("(required)");
    expect(screen.getByText("Price (USD)").parentElement).toHaveTextContent("(optional)");
    expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", today);
    expect(screen.getByRole("button", { name: "Save item" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows field errors, blocks submission, and focuses the first invalid field", async () => {
    const { user, onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^Price/), "12.345");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Fix 3 fields to save this item.")).toBeInTheDocument();
    const name = screen.getByLabelText(/^Name/);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(/Enter a name\./);
    expect(screen.getByLabelText(/^Purchase date/)).toHaveAccessibleDescription(
      /Enter the purchase date\./,
    );
    expect(screen.getByLabelText(/^Price/)).toHaveAccessibleDescription(
      /Use no more than two decimal places\./,
    );
    expect(screen.getByLabelText(/^Return deadline/)).not.toHaveAttribute("aria-invalid");
    expect(name).toHaveFocus();
  });

  it("updates errors as the user fixes fields after a failed attempt", async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole("button", { name: "Save item" }));
    await user.type(screen.getByLabelText(/^Name/), "Wool coat");

    expect(screen.getByLabelText(/^Name/)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText("Fix 1 field to save this item.")).toBeInTheDocument();
  });

  it("rejects deadlines before the purchase date", async () => {
    const { user, onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^Name/), "Wool coat");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-09");
    await user.type(screen.getByLabelText(/^Return deadline/), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Return deadline/)).toHaveAccessibleDescription(
      /Return deadline can’t be before the purchase date, Oct 9, 2026\./,
    );
  });

  it("passes validated values to onSubmit and clears the form after it resolves", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/^Name/), "  Wool coat ");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-09");
    await user.type(screen.getByLabelText(/^Price/), "0");
    await user.type(screen.getByLabelText(/^Return deadline/), "2026-11-08");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Wool coat",
      purchaseDate: "2026-10-09",
      priceCents: 0,
      returnDeadline: "2026-11-08",
      warrantyExpiration: null,
    });
    await waitFor(() => expect(screen.getByLabelText(/^Name/)).toHaveValue(""));
    expect(screen.getByLabelText(/^Price/)).toHaveValue("");
  });

  it("submits with the Enter key", async () => {
    const { user, onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-23");
    await user.type(screen.getByLabelText(/^Name/), "Desk lamp{Enter}");

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Desk lamp", purchaseDate: "2026-10-23", priceCents: null }),
    );
  });

  it("prevents duplicate submissions while saving", async () => {
    const save = deferred();
    const onSubmit = vi.fn().mockReturnValue(save.promise);
    const { user } = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/^Name/), "Wool coat");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-09");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    const saving = screen.getByRole("button", { name: "Saving…" });
    expect(saving).toHaveAttribute("aria-disabled", "true");
    await user.click(saving);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    save.resolve();
    expect(await screen.findByRole("button", { name: "Save item" })).toBeInTheDocument();
  });

  it("keeps the draft and offers a retry when the save fails", async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error("Network down")).mockResolvedValue(undefined);
    const { user } = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/^Name/), "Wool coat");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-09");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Couldn’t save this item\. Your entries are still here\./);
    expect(alert).not.toHaveTextContent("Network down");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Wool coat");
    expect(screen.getByLabelText(/^Purchase date/)).toHaveValue("2026-10-09");

    await user.click(screen.getByRole("button", { name: "Save item" }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("ignores Cancel while a save is pending, because the item is being saved anyway", async () => {
    const onSubmit = vi.fn(() => new Promise<void>(() => {}));
    const { user, onCancel } = renderForm(onSubmit);
    await user.type(screen.getByLabelText(/^Name/), "Wool coat");
    await user.type(screen.getByLabelText(/^Purchase date/), today);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    const cancel = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancel);

    expect(cancel).toHaveAttribute("aria-disabled", "true");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel without submitting", async () => {
    const { user, onSubmit, onCancel } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("locks the fields while a save is pending so the saved item matches the screen", async () => {
    const save = deferred();
    const onSubmit = vi.fn().mockReturnValue(save.promise);
    const { user } = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/^Name/), "Wool coat");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-09");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    await user.type(screen.getByLabelText(/^Name/), " (edited)");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Wool coat");
    expect(screen.getByLabelText(/^Name/)).toHaveAttribute("readonly");

    save.reject(new Error("Network down"));
    await screen.findByRole("alert");
    expect(screen.getByLabelText(/^Name/)).not.toHaveAttribute("readonly");
    await user.type(screen.getByLabelText(/^Name/), " (edited)");
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Wool coat (edited)");
  });

  it("shows field errors from a rejected save next to their fields and keeps the draft", async () => {
    // The item API (#4) validates again on the server; it can reject with messages per form field.
    const rejection = Object.assign(new Error("Validation failed"), {
      fieldErrors: { purchaseDate: "Purchase date can’t be in the future." },
    });
    const onSubmit = vi.fn().mockRejectedValue(rejection);
    const { user } = renderForm(onSubmit);

    await user.type(screen.getByLabelText(/^Name/), "Wool coat");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-23");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    const purchaseDate = screen.getByLabelText(/^Purchase date/);
    await waitFor(() => expect(purchaseDate).toHaveAccessibleDescription(/Purchase date can’t be in the future\./));
    expect(purchaseDate).toHaveAttribute("aria-invalid", "true");
    expect(purchaseDate).toHaveFocus();
    expect(screen.getByText("Fix 1 field to save this item.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Wool coat");
  });
});
