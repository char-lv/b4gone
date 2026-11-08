"use client";

import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  busyLabel?: string;
  error?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

/** A modal confirmation, such as before deleting a record (issue #5). */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return <dialog>{props.title}</dialog>;
}
