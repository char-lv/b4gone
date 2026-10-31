"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut(): Promise<void> {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.replace("/sign-in");
        router.refresh();
        return;
      }
    } catch {
      // Reported below; the user stays signed in and can try again.
    }
    setFailed(true);
    setPending(false);
  }

  return (
    <div className="flex items-center gap-3">
      {failed && (
        <span role="alert" className="text-sm font-semibold text-urgent">
          Couldn&apos;t sign out. Try again.
        </span>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="inline-flex min-h-9 items-center rounded-control border border-line-button bg-surface px-3 text-sm font-semibold text-ink shadow-control transition-colors hover:border-[#b9bebb] hover:bg-surface-hover disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
