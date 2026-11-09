import { BackLink } from "@/components/ui/BackLink";

export default function SubscriptionNotFound() {
  return (
    <>
      <BackLink href="/subscriptions">Back to subscriptions</BackLink>
      <h1 className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">Subscription not found</h1>
      <p className="mt-1.5 text-muted">It may have been deleted, or the link may be incomplete.</p>
    </>
  );
}
