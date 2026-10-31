"use client";

export type AuthMode = "sign-in" | "register";

export function AuthForm({ mode, next }: { mode: AuthMode; next?: string }) {
  void mode;
  void next;
  return null;
}
