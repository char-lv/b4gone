"use client";

import { type ReactNode, createContext, useContext, useState } from "react";

type NoticeScopeValue = { flashHidden: boolean; hideFlash: () => void };

const NoticeScopeContext = createContext<NoticeScopeValue>({ flashHidden: false, hideFlash: () => {} });

/**
 * Keeps one confirmation on a page at a time (issue #5): when an action shows its own message, the
 * one-time FlashNotice from opening the page, such as "Item saved.", is hidden.
 */
export function NoticeScope({ children }: { children: ReactNode }) {
  const [flashHidden, setFlashHidden] = useState(false);
  return (
    <NoticeScopeContext.Provider value={{ flashHidden, hideFlash: () => setFlashHidden(true) }}>
      {children}
    </NoticeScopeContext.Provider>
  );
}

export function useNoticeScope(): NoticeScopeValue {
  return useContext(NoticeScopeContext);
}
