"use client";

import { type ReactNode, type SyntheticEvent, useEffect, useId, useRef } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  /** The text under the title that says what confirming does; it describes the dialog. */
  children: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** True while the confirmed action runs: Esc and both buttons do nothing. */
  busy?: boolean;
  busyLabel?: string;
  error?: ReactNode;
  onConfirm: () => void;
  /** The dialog closed without confirming: the cancel button, Esc, or the browser closing it. */
  onClose: () => void;
};

/**
 * A modal confirmation, such as before deleting a record (issue #5). It opens with focus on the safe
 * choice and returns focus to the element that opened it.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  busy = false,
  busyLabel,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);
  // The latest props for the native close handler, which the browser can call at any time.
  const latest = useRef({ open, onClose });
  useEffect(() => {
    latest.current = { open, onClose };
  });
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      triggerRef.current = document.activeElement;
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // Esc: React state decides when the dialog closes, and it stays open while the action runs.
    event.preventDefault();
    if (!busy) onClose();
  }

  function handleClose() {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    // Chrome can close a modal on a repeated Esc even when cancel is prevented; follow it.
    if (latest.current.open) latest.current.onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClose={handleClose}
      className="m-auto w-[calc(100%-2rem)] max-w-[28rem] rounded-card border border-line bg-surface p-6 text-ink shadow-card backdrop:bg-ink/40"
    >
      <h2 id={titleId} className="mb-2 text-[1.125rem] font-semibold break-words">
        {title}
      </h2>
      <p id={descriptionId} className="text-muted">
        {children}
      </p>
      {error ? (
        <div role="alert" className="mt-4 rounded-control border border-urgent-line bg-urgent-soft px-4 py-3">
          {error}
        </div>
      ) : null}
      {/* As in the prototype: the action first, then the safe choice, which still receives focus. */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="danger" aria-disabled={busy || undefined} onClick={() => !busy && onConfirm()}>
          {busy && busyLabel ? busyLabel : confirmLabel}
        </Button>
        <Button ref={cancelRef} aria-disabled={busy || undefined} onClick={() => !busy && onClose()}>
          {cancelLabel}
        </Button>
      </div>
    </dialog>
  );
}
