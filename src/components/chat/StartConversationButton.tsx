"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { StartedConversation, Store } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { Alert, Button, cn } from "@/components/ui";

// Which store the signed-in vendor owns, so their own "Message store" button can
// be hidden. No public product or store payload carries an owner id and the JWT
// user has no store on it, so the answer has to be fetched; it is cached for the
// session and keyed by user so a logout cannot hide a button for the wrong person.
let ownStoreCache: { userId: string; storeId: string | null } | null = null;

type Props = {
  storeId: string;
  storeName: string;
  /** Scopes the thread to one order, so order questions get their own thread. */
  orderId?: string;
  /** Only ever applied when the thread is created; reuse never rewrites it. */
  subject?: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
};

// Opens a chat with a store. A leaf client component with string-only props, so
// the server-rendered product and store pages can drop it in the same way they
// already drop in AddToCartForm.
export const StartConversationButton = ({
  storeId,
  storeName,
  orderId,
  subject,
  label,
  variant = "outline",
  size = "md",
  className,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, isVendor } = useAuth();

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwnStore, setIsOwnStore] = useState(
    () => ownStoreCache?.storeId === storeId,
  );

  // Vendors only: buyers never pay for this request, and an order page showing
  // five vendors asks once because the answer is cached.
  useEffect(() => {
    if (!ready || !user || !isVendor) return;

    if (ownStoreCache?.userId === user.id) {
      setIsOwnStore(ownStoreCache.storeId === storeId);
      return;
    }

    let cancelled = false;

    const resolveOwnStore = async () => {
      try {
        const res = await api.get<Store>("/store/my-store");
        ownStoreCache = { userId: user.id, storeId: res.data.id };
      } catch {
        // A vendor without a store 404s here, which is a real answer: no match.
        ownStoreCache = { userId: user.id, storeId: null };
      }

      if (!cancelled) setIsOwnStore(ownStoreCache.storeId === storeId);
    };

    void resolveOwnStore();

    return () => {
      cancelled = true;
    };
  }, [ready, user, isVendor, storeId]);

  const start = async () => {
    setError(null);

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setStarting(true);

    try {
      const res = await api.post<StartedConversation>("/chat/conversations", {
        store_id: storeId,
        ...(orderId ? { order_id: orderId } : {}),
        ...(subject ? { subject } : {}),
      });

      // Creating is idempotent server side, so this opens the existing thread
      // rather than piling up duplicates. `starting` deliberately stays set:
      // the navigation ends this component, and clearing it would only invite a
      // second click on a button that is about to disappear.
      router.push(`/messages?c=${res.data.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not open that conversation.",
      );
      setStarting(false);
    }
  };

  if (isOwnStore) return null;

  const visibleLabel = user ? (label ?? "Message store") : "Log in to message";

  return (
    <div className={cn("inline-flex flex-col items-start gap-2", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={start}
        loading={starting}
        // Combined rather than left to `loading`: Button applies its own
        // disabled before spreading props, so an explicit one would win.
        disabled={!ready || starting}
        // Names the store for anyone who cannot see which card this sits in,
        // but keeps the visible text as the start of the accessible name so
        // voice control still matches what is on screen.
        aria-label={`${visibleLabel} — ${storeName}`}
      >
        {visibleLabel}
      </Button>

      {error && <Alert>{error}</Alert>}
    </div>
  );
};
