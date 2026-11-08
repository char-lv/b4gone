"use client";

import { type RefObject, useEffect, useRef } from "react";

/**
 * A ref that is false once the component has unmounted, for example when the user leaves a page
 * through the navigation while a save is pending. Code that navigates after a request checks it so
 * it never pulls the user back to a page they left.
 */
export function useMountedRef(): RefObject<boolean> {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
