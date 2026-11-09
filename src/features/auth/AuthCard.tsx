import Link from "next/link";
import type { ReactNode } from "react";

/** The white card that frames the sign-in and registration forms. */
export function AuthCard({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  footer: { text: string; linkText: string; href: string };
}) {
  return (
    <>
      <section className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-[1.625rem] font-[650] leading-tight tracking-[-0.015em]">{title}</h1>
        <p className="mt-1.5 mb-6 text-[0.9375rem] text-muted">{intro}</p>
        {children}
      </section>
      <p className="mt-5 text-center text-[0.9375rem] text-muted">
        {footer.text}{" "}
        <Link
          href={footer.href}
          className="font-semibold text-accent underline decoration-accent-line underline-offset-[3px] hover:decoration-current"
        >
          {footer.linkText}
        </Link>
      </p>
    </>
  );
}
