"use client";

import { useEffect, useState } from "react";
import { useNoticeScope } from "./NoticeScope";

type FlashNoticeProps = {
  /** True when the page was opened with ?{param}=1. */
  show: boolean;
  param: string;
  message: string;
  /** The element that receives focus with the message, such as the page heading. */
  focusId: string;
};

/**
 * A one-time confirmation after a page opens with a parameter, such as "Item saved." on the details
 * page (?saved=1, issue #4) or "Item deleted." on the list (?deleted=1, issue #5). The live region
 * renders empty first so screen readers announce the text, focus moves to the element with focusId,
 * and the parameter is dropped from the address so a reload or a later visit does not show it again.
 */
export function FlashNotice({ show, param, message, focusId }: FlashNoticeProps) {
  const [shown, setShown] = useState(false);
  // A later message on the same page replaces this one.
  const { flashHidden } = useNoticeScope();

  useEffect(() => {
    if (!show) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    // Add the text after the empty region is on the page; text present at mount is often not read.
    const timer = window.setTimeout(() => {
      setShown(true);
      document.getElementById(focusId)?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [show, param, focusId]);

  return (
    <div role="status" aria-live="polite">
      {shown && !flashHidden ? (
        <p className="mb-5 max-w-[46rem] rounded-control border border-accent-line bg-accent-soft px-4 py-3 text-[0.9375rem]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
