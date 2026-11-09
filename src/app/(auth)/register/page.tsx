import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/features/auth/AuthCard";
import { AuthForm } from "@/features/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth/server-session";
import { safeNextPath } from "@/lib/http/safe-redirect";

export const metadata: Metadata = { title: "Create your account" };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  if (await getCurrentUser().catch(() => null)) redirect(nextPath);

  return (
    <AuthCard
      title="Create your account"
      intro="Track return windows, warranties, and renewals in one private place."
      footer={{
        text: "Already have an account?",
        linkText: "Sign in",
        href: next ? `/sign-in?next=${encodeURIComponent(nextPath)}` : "/sign-in",
      }}
    >
      <AuthForm mode="register" next={nextPath} />
    </AuthCard>
  );
}
