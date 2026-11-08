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

/** Button styles for other elements, such as a link that starts an action like "Add item". */
export function buttonClassName(variant: ButtonVariant = "secondary", className?: string): string {
  return [BASE, VARIANTS[variant], className].filter(Boolean).join(" ");
}

export function Button({ variant = "secondary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}
