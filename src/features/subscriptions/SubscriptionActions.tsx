"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { localTimeZone } from "@/features/items/local-today";
import { useNoticeScope } from "@/features/items/NoticeScope";
import { useMountedRef } from "@/features/items/use-mounted-ref";
import { formatDateOnly } from "@/lib/dates";
import {
  SUBSCRIPTION_GONE_MESSAGE,
  SUBSCRIPTIONS_LINK,
  SubscriptionRequestError,
  sendSubscriptionRequest,
} from "./subscription-client";
import type { Subscription } from "./subscription-repository";

type ActionError = { message: string; link?: { href: string; label: string } };

const ACTION_SIGNED_OUT_MESSAGE = "You’ve been signed out. Sign in again in a new tab, then try again.";

function actionError(error: unknown, fallback: string): ActionError {
  if (error instanceof SubscriptionRequestError && error.status === 401) return { message: ACTION_SIGNED_OUT_MESSAGE };
  if (error instanceof SubscriptionRequestError && error.status === 404) {
    return { message: SUBSCRIPTION_GONE_MESSAGE, link: SUBSCRIPTIONS_LINK };
  }
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

function reactivatedMessage(name: string, reply: unknown): string {
  const next = (reply as { subscription?: { nextBillingDate?: unknown } } | null)?.subscription?.nextBillingDate;
  return typeof next === "string"
    ? `“${name}” is active again. Next charge: ${formatDateOnly(next)}.`
    : `“${name}” is active again.`;
}

/**
 * Edit, Cancel subscription / Reactivate subscription, and Delete subscription for one subscription
 * (issue #7). Each change waits for the server, ignores repeated clicks while pending, and refreshes
 * the page data afterwards so the list, details, and totals show the saved state.
 */
export function SubscriptionActions({ subscription }: { subscription: Subscription }) {
  const router = useRouter();
  const active = subscription.status === "active";

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
      // The reply's next billing date is calculated from the original anchor in this time zone.
      const reply = await sendSubscriptionRequest(`/api/subscriptions/${subscription.id}/status`, "PUT", {
        status: active ? "cancelled" : "active",
        timeZone: localTimeZone(),
      });
      hideFlash();
      setNotice(
        active
          ? `Cancelled “${subscription.name}”. Its renewal reminder and cost no longer count.`
          : reactivatedMessage(subscription.name, reply),
      );
      // The button stays pending until the refreshed subscription arrives with its new status.
      startRefresh(() => router.refresh());
    } catch (error) {
      hideFlash();
      setStatusError(
        actionError(error, active ? "Couldn’t cancel this subscription. Try again." : "Couldn’t reactivate this subscription. Try again."),
      );
    } finally {
      statusBusy.current = false;
      setStatusSaving(false);
    }
  }

  function openDeleteDialog() {
    setDeleteError(null);
    setDialogOpen(true);
  }

  async function deleteThisSubscription() {
    if (deleteBusy.current) return;
    deleteBusy.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      await sendSubscriptionRequest(`/api/subscriptions/${subscription.id}`, "DELETE");
    } catch (error) {
      deleteBusy.current = false;
      setDeleting(false);
      setDeleteError(actionError(error, "Couldn’t delete this subscription. Try again."));
      return;
    }
    // Open the list first: refreshing here would render this page again as "Subscription not found".
    // The refresh then drops cached pages, so Back does not show the deleted subscription either.
    if (mounted.current) router.push("/subscriptions?deleted=1");
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
        <Link href={`/subscriptions/${subscription.id}/edit`} className={buttonClassName("primary")}>
          Edit subscription
        </Link>
        {/* One button for both labels, so focus stays on it when the status changes. */}
        <Button aria-disabled={statusPending || undefined} onClick={toggleStatus}>
          {statusPending ? "Saving…" : active ? "Cancel subscription" : "Reactivate subscription"}
        </Button>
        <Button variant="danger-outline" onClick={openDeleteDialog}>
          Delete subscription
        </Button>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title={`Delete “${subscription.name}”?`}
        confirmLabel="Delete subscription"
        cancelLabel="Keep subscription"
        busy={deleting}
        busyLabel="Deleting…"
        error={dialogOpen && deleteError ? <ErrorText error={deleteError} /> : undefined}
        onConfirm={deleteThisSubscription}
        onClose={() => setDialogOpen(false)}
      >
        This removes the subscription and its renewal reminder.
      </ConfirmDialog>
    </>
  );
}
