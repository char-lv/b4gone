import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/Wordmark";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:py-16">
      <Wordmark href="/" />
      <main id="main" className="mt-8 w-full max-w-[26rem]">
        {children}
      </main>
    </div>
  );
}
