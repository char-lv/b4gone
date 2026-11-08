"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ITEM_GONE_MESSAGE, ITEMS_LINK, ItemRequestError, sendItemRequest } from "./item-client";
import { dashboardDeadlines } from "./item-deadlines";
import type { Item } from "./item-repository";
import { useLocalToday } from "./local-today";
import { useNoticeScope } from "./NoticeScope";
import { useMountedRef } from "./use-mounted-ref";

type ActionError = { message: string; link?: { href: string; label: string } };

const ACTION_SIGNED_OUT_MESSAGE = "You’ve been signed out. Sign in again in a new tab, then try again.";

function deadlines(count: number): string {
  return `${count} ${count === 1 ? "deadline" : "deadlines"}`;
}

function returnedMessage(name: string, count: number): string {
  return count > 0
    ? `Marked “${name}” as returned. ${deadlines(count)} removed from the dashboard.`
    : `Marked “${name}” as returned. It had no deadlines on the dashboard.`;
}

function restoredMessage(name: string, count: number): string {
  return count > 0
    ? `“${name}” is active again. ${deadlines(count)} back on the dashboard.`
    : `“${name}” is active again. None of its dates fall in the next 30 days, so the dashboard is unchanged.`;
}

function actionError(error: unknown, fallback: string): ActionError {
  if (error instanceof ItemRequestError && error.status === 401) return { message: ACTION_SIGNED_OUT_MESSAGE };
  if (error instanceof ItemRequestError && error.status === 404) return { message: ITEM_GONE_MESSAGE, link: ITEMS_LINK };
  return { message: fallback };
}

function ErrorText({ error }: { error: ActionError }) {
  return (
    <>
      {error.message}
      {error.link ? (
        <>
          {" "}
          <Link href={error.link.href} className="font-semibold text-accent underline underline-offset-[3px]">
            {error.link.label}
          </Link>
        </>
      ) : null}
    </>
  );
}

/**
 * Edit, Mark as returned / Undo return, and Delete item for one item (issue #5). Each change waits
 * for the server, ignores repeated clicks while pending, and refreshes the page data afterwards.
 */
export function ItemActions({ item }: { item: Item }) {
  const router = useRouter();
  const today = useLocalToday();
  const active = item.status === "active";
  // Returning removes, and undoing restores, the deadlines the item has on the dashboard while active.
  const activeDeadlineCount = today ? dashboardDeadlines({ ...item, status: "active" }, today).length : 0;
  const shownDeadlineCount = today ? dashboardDeadlines(item, today).length : 0;

  const [statusSaving, setStatusSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const statusBusy = useRef(false);
  const [notice, setNotice] = useState("");
  const [statusError, setStatusError] = useState<ActionError | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteBusy = useRef(false);
  const [deleteError, setDeleteError] = useState<ActionError | null>(null);

  const mounted = useMountedRef();
  const { hideFlash } = useNoticeScope();

  async function toggleStatus() {
    if (statusBusy.current || refreshing) return;
    statusBusy.current = true;
    setStatusSaving(true);
    setNotice("");
    setStatusError(null);
    try {
      await sendItemRequest(`/api/items/${item.id}/status`, "PUT", { status: active ? "returned" : "active" });
      hideFlash();
      setNotice(active ? returnedMessage(item.name, activeDeadlineCount) : restoredMessage(item.name, activeDeadlineCount));
      // The button stays pending until the refreshed item arrives with its new status.
      startRefresh(() => router.refresh());
    } catch (error) {
      hideFlash();
      setStatusError(actionError(error, active ? "Couldn’t mark this item as returned. Try again." : "Couldn’t undo the return. Try again."));
    } finally {
      statusBusy.current = false;
      setStatusSaving(false);
    }
  }

  function openDeleteDialog() {
    setDeleteError(null);
    setDialogOpen(true);
  }

  async function deleteThisItem() {
    if (deleteBusy.current) return;
    deleteBusy.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      await sendItemRequest(`/api/items/${item.id}`, "DELETE");
    } catch (error) {
      deleteBusy.current = false;
      setDeleting(false);
      setDeleteError(actionError(error, "Couldn’t delete this item. Try again."));
      return;
    }
    // Open the list first: refreshing here would render this item's page again as "Item not found".
    // The refresh then drops cached pages, so Back does not show the deleted item either. The dialog
    // stays pending until the list replaces this page.
    if (mounted.current) router.push("/items?deleted=1");
    router.refresh();
  }

  const statusPending = statusSaving || refreshing;
  const pageError = statusError ?? (dialogOpen ? null : deleteError);

  return (
    <>
      <div role="status" aria-live="polite" className="max-w-[46rem]">
        {notice ? (
          <p className="mt-6 rounded-control border border-accent-line bg-accent-soft px-4 py-3 text-[0.9375rem]">{notice}</p>
        ) : null}
      </div>
      {pageError ? (
        <div role="alert" className="mt-6 max-w-[46rem] rounded-control border border-urgent-line bg-urgent-soft px-4 py-3">
          <ErrorText error={pageError} />
        </div>
      ) : null}

      <div className="mt-7 flex flex-wrap gap-2">
        <Link href={`/items/${item.id}/edit`} className={buttonClassName("primary")}>
          Edit item
        </Link>
        {/* One button for both labels, so focus stays on it when the status changes. */}
        <Button aria-disabled={statusPending || undefined} onClick={toggleStatus}>
          {statusPending ? "Saving…" : active ? "Mark as returned" : "Undo return"}
        </Button>
        <Button variant="danger-outline" onClick={openDeleteDialog}>
          Delete item
        </Button>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title={`Delete “${item.name}”?`}
        confirmLabel="Delete item"
        cancelLabel="Keep item"
        busy={deleting}
        busyLabel="Deleting…"
        error={dialogOpen && deleteError ? <ErrorText error={deleteError} /> : undefined}
        onConfirm={deleteThisItem}
        onClose={() => setDialogOpen(false)}
      >
        {shownDeadlineCount > 0
          ? `This removes the item and its ${shownDeadlineCount} dashboard ${shownDeadlineCount === 1 ? "deadline" : "deadlines"}.`
          : "This removes the item."}
      </ConfirmDialog>
    </>
  );
}
