import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

// jsdom does not open dialogs or handle Esc, so vitest.setup.ts adds showModal/close, and these tests
// fire the "cancel" and "close" events that a browser sends. Playwright checks the real Esc key.
function Harness({ busy = false, onConfirm = vi.fn() }: { busy?: boolean; onConfirm?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete item
      </button>
      <ConfirmDialog
        open={open}
        title="Delete “Wool coat”?"
        confirmLabel="Delete item"
        cancelLabel="Keep item"
        busy={busy}
        busyLabel="Deleting…"
        onConfirm={onConfirm}
        onClose={() => setOpen(false)}
      >
        This removes the item.
      </ConfirmDialog>
    </>
  );
}

function dialog(): HTMLDialogElement {
  return screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement;
}

describe("ConfirmDialog", () => {
  it("opens as a modal named by its title and described by its text, with focus on the safe choice", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Delete item" }));

    expect(dialog().open).toBe(true);
    expect(screen.getByRole("dialog", { name: "Delete “Wool coat”?" })).toHaveAccessibleDescription("This removes the item.");
    expect(screen.getByRole("button", { name: "Keep item" })).toHaveFocus();
  });

  it("closes on the cancel button and returns focus to the button that opened it", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete item" }));
    await user.click(screen.getByRole("button", { name: "Keep item" }));

    expect(dialog().open).toBe(false);
    expect(screen.getByRole("button", { name: "Delete item" })).toHaveFocus();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes on Esc and returns focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Delete item" }));
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog().dispatchEvent(cancel);
    });

    expect(dialog().open).toBe(false);
    expect(screen.getByRole("button", { name: "Delete item" })).toHaveFocus();
  });

  it("calls onConfirm from the confirm button", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete item" }));
    await user.click(screen.getAllByRole("button", { name: "Delete item" })[1]);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  describe("while the confirmed action is pending", () => {
    it("keeps the dialog open on Esc and ignores both buttons", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const { rerender } = render(<Harness onConfirm={onConfirm} />);
      await user.click(screen.getByRole("button", { name: "Delete item" }));
      rerender(<Harness busy onConfirm={onConfirm} />);

      const cancel = new Event("cancel", { cancelable: true });
      act(() => {
        dialog().dispatchEvent(cancel);
      });
      expect(cancel.defaultPrevented).toBe(true);
      expect(dialog().open).toBe(true);

      const keep = screen.getByRole("button", { name: "Keep item" });
      expect(keep).toHaveAttribute("aria-disabled", "true");
      await user.click(keep);
      await user.click(screen.getByRole("button", { name: "Deleting…" }));
      expect(dialog().open).toBe(true);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("keeps its open state in step when the browser closes it anyway", async () => {
      // Chrome can close a modal on a repeated Esc even when the cancel event is prevented.
      const user = userEvent.setup();
      const { rerender } = render(<Harness />);
      await user.click(screen.getByRole("button", { name: "Delete item" }));
      rerender(<Harness busy />);

      act(() => {
        dialog().close();
      });
      rerender(<Harness />);
      await user.click(screen.getByRole("button", { name: "Delete item" }));

      expect(dialog().open).toBe(true);
    });
  });

  it("shows an error inside the dialog", () => {
    render(
      <ConfirmDialog open title="Delete “Wool coat”?" confirmLabel="Delete item" cancelLabel="Keep item" error="Couldn’t delete this item. Try again." onConfirm={vi.fn()} onClose={vi.fn()}>
        This removes the item.
      </ConfirmDialog>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t delete this item. Try again.");
  });
});
