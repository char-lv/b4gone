import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/features/auth/AuthCard";
import { AuthForm } from "@/features/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth/server-session";
import { safeNextPath } from "@/lib/http/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  if (await getCurrentUser().catch(() => null)) redirect(nextPath);

  return (
    <AuthCard
      title="Sign in"
      intro="Welcome back. Your deadlines are waiting."
      footer={{
        text: "New to B4Gone?",
        linkText: "Create an account",
        href: next ? `/register?next=${encodeURIComponent(nextPath)}` : "/register",
      }}
    >
      <AuthForm mode="sign-in" next={nextPath} />
    </AuthCard>
  );
}
