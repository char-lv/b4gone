"use client";

import { useEffect, useState } from "react";

/**
 * "Item saved." after the add form opens the details page with ?saved=1 (issue #4). The live region
 * renders empty first so screen readers announce the text, and the parameter is dropped from the
 * address so a reload or a later visit does not confirm the save again.
 */
export function SavedNotice({ saved }: { saved: boolean }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    // Add the text after the empty region is on the page; text present at mount is often not read.
    const timer = window.setTimeout(() => setShown(true), 0);
    return () => window.clearTimeout(timer);
  }, [saved]);

  return (
    <div role="status" aria-live="polite">
      {shown ? (
        <p className="mb-5 max-w-[46rem] rounded-control border border-accent-line bg-accent-soft px-4 py-3 text-[0.9375rem]">
          Item saved.
        </p>
      ) : null}
    </div>
  );
}
