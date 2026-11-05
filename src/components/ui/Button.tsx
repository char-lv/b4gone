import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const BASE =
  "inline-flex min-h-[2.375rem] items-center justify-center rounded-control border px-4 py-1.5 text-[0.9375rem] font-semibold shadow-control cursor-pointer aria-disabled:cursor-progress aria-disabled:opacity-70";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover",
  secondary: "border-line-button bg-surface text-ink hover:bg-surface-hover",
};

export function Button({ variant = "secondary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={[BASE, VARIANTS[variant], className].filter(Boolean).join(" ")} {...props} />
  );
}
