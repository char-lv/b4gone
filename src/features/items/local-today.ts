"use client";

import { useSyncExternalStore } from "react";
import { todayInTimeZone } from "@/lib/dates";

// How often an open page checks whether the local date has changed, such as at midnight.
const DATE_CHECK_INTERVAL_MS = 30_000;

function subscribeToLocalDate(onChange: () => void): () => void {
  const interval = setInterval(onChange, DATE_CHECK_INTERVAL_MS);
  // Timers pause while a laptop sleeps, so also check when the page becomes visible again.
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(interval);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** The user's current local calendar date, read from the clock each time it is called. */
export function getLocalToday(): string {
  return todayInTimeZone(localTimeZone(), new Date());
}

// The server cannot know the user's time zone, so "today" is only known in the browser.
function getServerToday(): null {
  return null;
}

/**
 * The user's local today (YYYY-MM-DD), or null during server rendering and hydration. Components
 * re-render when the date changes, such as at midnight, so open pages follow the clock.
 */
export function useLocalToday(): string | null {
  return useSyncExternalStore(subscribeToLocalDate, getLocalToday, getServerToday);
}
