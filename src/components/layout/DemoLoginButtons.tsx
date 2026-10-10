"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth, type DemoRole } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { Alert, Button } from "@/components/ui";

// Role is a single column, so no one account can show the buyer pages, the
// vendor dashboard and the admin panel at once. Rather than hide two thirds of
// the project behind one button, the visitor picks which side to look at.
const ROLES: { role: DemoRole; label: string; home: string }[] = [
  { role: "BUYER", label: "Buyer", home: "/" },
  { role: "VENDOR", label: "Vendor", home: "/vendor" },
  { role: "ADMIN", label: "Admin", home: "/admin/stores" },
];

export const DemoLoginButtons = ({ redirectTo }: { redirectTo: string }) => {
  const router = useRouter();
  const { demoLogin } = useAuth();
  const { refresh } = useCart();

  const [pending, setPending] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (role: DemoRole, home: string) => {
    setError(null);
    setPending(role);

    try {
      await demoLogin(role);
      await refresh();
      // A deep link that bounced through login still wins, otherwise land where
      // this role actually has something to look at.
      router.push(redirectTo !== "/" ? redirectTo : home);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not open the demo account.",
      );
      setPending(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs uppercase tracking-wide text-slate-400">
            or explore as a test user
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {ROLES.map((item) => (
          <Button
            key={item.role}
            type="button"
            variant="outline"
            onClick={() => start(item.role, item.home)}
            loading={pending === item.role}
            // Combined: Button applies its own disabled before spreading props,
            // so an explicit one would otherwise cancel `loading`.
            disabled={pending !== null}
            aria-label={`${item.label} — explore as a read-only test user`}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
        No sign-up, and nothing can be changed. The buyer shops, the vendor runs a
        store, the admin runs the marketplace.
      </p>
    </div>
  );
};
