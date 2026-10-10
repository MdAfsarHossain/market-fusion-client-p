"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { EmptyState, Spinner, ButtonLink } from "@/components/ui";

type Guard = "user" | "vendor" | "admin";

// Client-side guard. The API enforces the real rules; this only keeps the UI
// from flashing pages the user cannot use.
export const RequireAuth = ({
  guard = "user",
  children,
}: {
  guard?: Guard;
  children: ReactNode;
}) => {
  const { user, ready, isVendor, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) {
      // usePathname drops the query string, which would lose the thread in
      // /messages?c=<id>. useSearchParams would force a prerender bailout on
      // every page behind this guard, and an effect only ever runs in the
      // browser, so the live URL is the safe place to read it from.
      const target = `${pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [ready, user, router, pathname]);

  if (!ready || (!user && typeof window !== "undefined")) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  if (guard === "vendor" && !isVendor && !isAdmin) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="You do not have a store yet"
          description="Open a store to list products and start receiving orders."
          action={<ButtonLink href="/vendor/store/new">Open a store</ButtonLink>}
        />
      </div>
    );
  }

  if (guard === "admin" && !isAdmin) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Admins only"
          description="You do not have permission to view this page."
          action={<ButtonLink href="/">Back to marketplace</ButtonLink>}
        />
      </div>
    );
  }

  return <>{children}</>;
};
